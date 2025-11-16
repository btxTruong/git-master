import { useCallback, useState } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useChangelistStore } from '@/stores/changelistStore';
import { useStagingStore } from '@/stores/stagingStore';
import { StageMultipleFilePaths } from '../../wailsjs/go/services/StagingService';
import { getWorkingDirectoryStatus } from '@/api/staging';
import toast from 'react-hot-toast';

export interface CommitFromGroupOptions {
  groupId: string;
  groupName: string;
  filePaths?: string[]; // If provided, commit only these files; otherwise commit all files in group
  prefilledMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for committing files from a changelist group
 * Handles staging files from the group and opening the commit dialog
 */
export function useCommitFromGroup() {
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const currentRepository = useRepositoryStore((state) => state.currentRepository);
  const { groups, reconcileWithGitStatus } = useChangelistStore();
  const { setCommitMessage } = useStagingStore();

  const commitFromGroup = useCallback(
    async ({
      groupId,
      groupName,
      filePaths,
      prefilledMessage,
      onSuccess,
      onError,
    }: CommitFromGroupOptions) => {
      if (!currentRepository) {
        const error = new Error('No repository selected');
        toast.error(error.message);
        onError?.(error);
        return;
      }

      try {
        // Find the group
        const group = groups.find((g) => g.id === groupId);
        if (!group) {
          throw new Error(`Group "${groupName}" not found`);
        }

        // Determine which files to stage
        const filesToStage = filePaths || group.items.map((item) => item.path);

        if (filesToStage.length === 0) {
          toast('No files to commit in this group');
          return;
        }

        // Stage the files
        toast.loading(
          `Staging ${filesToStage.length} file${filesToStage.length !== 1 ? 's' : ''}...`
        );

        try {
          await StageMultipleFilePaths(filesToStage);
        } catch (stagingError) {
          toast.dismiss();
          throw new Error(
            `Failed to stage files: ${stagingError instanceof Error ? stagingError.message : String(stagingError)}`
          );
        }

        toast.dismiss();

        // Refresh Git status to update the staging store
        const newStatus = await getWorkingDirectoryStatus();
        const statusSignature = JSON.stringify({
          staged: newStatus.stagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
          unstaged: newStatus.unstagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
          untracked: newStatus.untrackedFiles.map((f) => `${f.path}:${f.status}`).sort(),
        });

        await reconcileWithGitStatus(currentRepository.path, statusSignature);

        // Set prefilled commit message if provided
        if (prefilledMessage) {
          setCommitMessage(prefilledMessage);
        } else {
          // Use a default template based on group name
          setCommitMessage(`feat: ${groupName}`);
        }

        // Open the commit dialog
        setIsCommitDialogOpen(true);

        toast.success(
          `Staged ${filesToStage.length} file${filesToStage.length !== 1 ? 's' : ''} from "${groupName}"`
        );

        onSuccess?.();
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        // Provide recovery suggestions based on error type
        const errorMessage = errorObj.message;
        let suggestion = '';

        if (errorMessage.includes('not found')) {
          suggestion = 'The group or files may have been modified or deleted.';
        } else if (errorMessage.includes('permission denied')) {
          suggestion =
            'Check that you have write permissions for these files and they are not locked by another process.';
        } else if (errorMessage.includes('failed to stage')) {
          suggestion =
            'Some files may be in an invalid state. Try refreshing the repository status.';
        }

        const fullMessage = suggestion ? `${errorMessage}\n\n${suggestion}` : errorMessage;

        toast.error(fullMessage, { duration: 6000 });
        onError?.(errorObj);
      }
    },
    [currentRepository, groups, reconcileWithGitStatus, setCommitMessage]
  );

  const closeCommitDialog = useCallback(() => {
    setIsCommitDialogOpen(false);
  }, []);

  return {
    commitFromGroup,
    isCommitDialogOpen,
    closeCommitDialog,
  };
}
