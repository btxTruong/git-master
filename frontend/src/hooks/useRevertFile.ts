import { useCallback, useState } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useChangelistStore } from '@/stores/changelistStore';
import { RevertFileChanges } from '../../wailsjs/go/services/StagingService';
import { services } from '../../wailsjs/go/models';
import { getWorkingDirectoryStatus } from '@/api/staging';
import toast from 'react-hot-toast';

export interface RevertFileOptions {
  filePath: string;
  groupId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface RevertConfirmation {
  filePath: string;
  message: string;
  revertStagedChanges: boolean;
  revertUnstagedChanges: boolean;
  deleteUntrackedFiles: boolean;
  groupId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for reverting file changes with proper handling of different file states
 */
export function useRevertFile() {
  const currentRepository = useRepositoryStore((state) => state.currentRepository);
  const { removeFilesFromGroup, reconcileWithGitStatus } = useChangelistStore();
  const [confirmationState, setConfirmationState] = useState<RevertConfirmation | null>(null);

  const revertFile = useCallback(
    async ({ filePath, groupId, onSuccess, onError }: RevertFileOptions) => {
      if (!currentRepository) {
        const error = new Error('No repository selected');
        toast.error(error.message);
        onError?.(error);
        return;
      }

      try {
        // Get current status to determine file state
        const status = await getWorkingDirectoryStatus();
        const allFiles = [...status.stagedFiles, ...status.unstagedFiles, ...status.untrackedFiles];

        const fileStatus = allFiles.find((f) => f.path === filePath);

        if (!fileStatus) {
          throw new Error(`File "${filePath}" not found in working directory status`);
        }

        // Determine what type of changes to revert based on file status
        let confirmMessage = '';
        let revertStagedChanges = false;
        let revertUnstagedChanges = false;
        let deleteUntrackedFiles = false;

        // Check if file is untracked
        const isUntracked = status.untrackedFiles.some((f) => f.path === filePath);

        // Check if file is staged
        const isStaged = status.stagedFiles.some((f) => f.path === filePath);

        // Check if file has unstaged changes
        const hasUnstagedChanges = status.unstagedFiles.some((f) => f.path === filePath);

        if (isUntracked) {
          confirmMessage = `Are you sure you want to delete the untracked file "${filePath}"? This action cannot be undone.`;
          deleteUntrackedFiles = true;
        } else if (isStaged && hasUnstagedChanges) {
          confirmMessage = `"${filePath}" has both staged and unstaged changes. Do you want to revert all changes? This will:\n- Unstage the file\n- Discard all modifications\n\nThis action cannot be undone.`;
          revertStagedChanges = true;
          revertUnstagedChanges = true;
        } else if (isStaged) {
          confirmMessage = `"${filePath}" is staged. Do you want to unstage it and discard all changes? This action cannot be undone.`;
          revertStagedChanges = true;
          revertUnstagedChanges = true;
        } else if (hasUnstagedChanges) {
          confirmMessage = `Are you sure you want to discard all changes in "${filePath}"? This action cannot be undone.`;
          revertUnstagedChanges = true;
        } else {
          toast(`No changes to revert for "${filePath}"`);
          return;
        }

        // Store confirmation state and return - the UI will show the modal
        setConfirmationState({
          filePath,
          message: confirmMessage,
          revertStagedChanges,
          revertUnstagedChanges,
          deleteUntrackedFiles,
          groupId,
          onSuccess,
          onError,
        });
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        toast.error(errorObj.message);
        onError?.(errorObj);
      }
    },
    [currentRepository]
  );

  const confirmRevert = useCallback(
    async () => {
      if (!confirmationState || !currentRepository) {
        return;
      }

      const {
        filePath,
        revertStagedChanges,
        revertUnstagedChanges,
        deleteUntrackedFiles,
        groupId,
        onSuccess,
        onError,
      } = confirmationState;

      try {
        // Create revert options
        const revertOptions = new services.RevertOptions({
          RevertStagedChanges: revertStagedChanges,
          RevertUnstagedChanges: revertUnstagedChanges,
          DeleteUntrackedFiles: deleteUntrackedFiles,
        });

        // Perform the revert operation
        await RevertFileChanges(filePath, revertOptions);

        // Remove file from changelist group if specified
        // Only remove from custom groups, not derived groups like __tracked__ or __untracked__
        if (groupId && !groupId.startsWith('__')) {
          await removeFilesFromGroup(currentRepository.path, groupId, [filePath]);
        }

        // Refresh Git status to ensure UI is up to date
        const newStatus = await getWorkingDirectoryStatus();
        const statusSignature = JSON.stringify({
          staged: newStatus.stagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
          unstaged: newStatus.unstagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
          untracked: newStatus.untrackedFiles.map((f) => `${f.path}:${f.status}`).sort(),
        });

        await reconcileWithGitStatus(currentRepository.path, statusSignature);

        // Show success message
        const isUntracked = deleteUntrackedFiles;
        if (isUntracked) {
          toast.success(`Deleted untracked file "${filePath}"`);
        } else {
          toast.success(`Reverted changes in "${filePath}"`);
        }

        // Clear confirmation state and call success callback
        setConfirmationState(null);
        onSuccess?.();
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        // Provide recovery suggestions based on error type
        const errorMessage = errorObj.message;
        let suggestion = '';

        if (errorMessage.includes('not found')) {
          suggestion = 'The file may have been already reverted or deleted.';
        } else if (errorMessage.includes('permission denied')) {
          suggestion =
            'Check that you have write permissions for this file and it is not locked by another process.';
        } else if (errorMessage.includes('failed to revert')) {
          suggestion = 'Try refreshing the repository status and attempting the operation again.';
        }

        const fullMessage = suggestion ? `${errorMessage}\n\n${suggestion}` : errorMessage;

        toast.error(fullMessage, { duration: 6000 });
        setConfirmationState(null);
        onError?.(errorObj);
      }
    },
    [confirmationState, currentRepository, removeFilesFromGroup, reconcileWithGitStatus]
  );

  const cancelRevert = useCallback(() => {
    setConfirmationState(null);
  }, []);

  return {
    revertFile,
    confirmRevert,
    cancelRevert,
    confirmationState,
  };
}
