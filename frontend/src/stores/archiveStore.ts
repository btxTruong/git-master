import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { ArchiveListEntry, ArchiveMetadata } from '@/types/changelist';
import type { services } from '../../wailsjs/go/models';
import {
  getArchiveList,
  getArchiveMetadata,
  getArchiveDiffContent,
  deleteArchiveByName,
  renameArchiveByName,
  restoreArchiveToWorkingTree,
} from '@/api/changelist';

export interface RestoreOptions {
  createBackup: boolean;
  targetGroupId?: string;
  newGroupName?: string;
  useThreeWay: boolean;
  allowReject: boolean;
  modifyIndex: boolean;
}

export interface RestoreResult {
  success: boolean;
  backupStashRef?: string;
  appliedCleanly: boolean;
  rejectFiles?: string[];
  errorMessage?: string;
  filesAffected?: string[];
}

interface ArchiveState {
  // Core state
  archives: ArchiveListEntry[];
  selectedArchiveId: string | null;
  selectedArchiveMetadata: ArchiveMetadata | null;
  archiveDiffContent: string | null;
  isLoading: boolean;
  error: string | null;

  // Granular loading states
  isRestoring: boolean;
  operationInProgress: string | null; // Track which operation is running

  // Actions
  loadArchives: () => Promise<void>;
  loadArchiveDetails: (archiveName: string) => Promise<void>;
  loadArchiveDiff: (archiveName: string) => Promise<void>;
  restoreArchive: (archiveName: string, options: RestoreOptions) => Promise<RestoreResult>;
  renameArchive: (oldArchiveName: string, newArchiveName: string) => Promise<void>;
  deleteArchive: (archiveName: string) => Promise<void>;

  // UI state actions
  setSelectedArchive: (archiveId: string | null) => void;
  reset: () => void;
}

export const useArchiveStore = create<ArchiveState>()((set, get) => ({
  // Initial state
  archives: [],
  selectedArchiveId: null,
  selectedArchiveMetadata: null,
  archiveDiffContent: null,
  isLoading: false,
  error: null,
  isRestoring: false,
  operationInProgress: null,

  // Load all archives
  loadArchives: async () => {
    set({ isLoading: true, error: null });

    try {
      const archives = await getArchiveList();

      set({
        archives,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load archives';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Load detailed metadata for a specific archive
  loadArchiveDetails: async (archiveName: string) => {
    set({ isLoading: true, error: null });

    try {
      const metadata = await getArchiveMetadata(archiveName);

      set({
        selectedArchiveMetadata: metadata,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load archive details';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Load diff content for a specific archive
  loadArchiveDiff: async (archiveName: string) => {
    set({ isLoading: true, error: null });

    try {
      const diffContent = await getArchiveDiffContent(archiveName);

      set({
        archiveDiffContent: diffContent,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load archive diff';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Restore an archive to the working tree
  restoreArchive: async (archiveName: string, options: RestoreOptions): Promise<RestoreResult> => {
    set({ isLoading: true, isRestoring: true, error: null });

    try {
      // Convert frontend options to backend format
      const backendOptions: services.RestoreOptions = {
        CreateBackup: options.createBackup,
        TargetGroupID: options.targetGroupId || '',
        NewGroupName: options.newGroupName || '',
        UseThreeWay: options.useThreeWay,
        AllowReject: options.allowReject,
        ModifyIndex: options.modifyIndex,
      };

      const result = await restoreArchiveToWorkingTree(archiveName, backendOptions);

      set({ isLoading: false, isRestoring: false });

      // Convert backend result to frontend format
      const frontendResult: RestoreResult = {
        success: result.success,
        backupStashRef: result.backupStashRef,
        appliedCleanly: result.appliedCleanly,
        rejectFiles: result.rejectFiles,
        errorMessage: result.errorMessage,
        filesAffected: result.filesAffected,
      };

      if (result.success) {
        if (result.appliedCleanly) {
          toast.success(`Restored archive "${archiveName}" successfully`);
        } else {
          toast.success(`Restored archive "${archiveName}" with conflicts. Check reject files.`, {
            duration: 5000,
          });
        }
      } else {
        toast.error(result.errorMessage || 'Failed to restore archive');
      }

      return frontendResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore archive';
      set({ error: message, isLoading: false, isRestoring: false });
      toast.error(message);
      throw error;
    }
  },

  // Rename an archive
  renameArchive: async (oldArchiveName: string, newArchiveName: string) => {
    const previousArchives = get().archives;
    set({ operationInProgress: 'rename-archive' });

    try {
      // Optimistically update the archive name
      const updatedArchives = previousArchives.map((archive) =>
        archive.archiveName === oldArchiveName
          ? { ...archive, archiveName: newArchiveName }
          : archive
      );

      set({ archives: updatedArchives });

      await renameArchiveByName(oldArchiveName, newArchiveName);

      set({ operationInProgress: null });
      toast.success(`Renamed archive to "${newArchiveName}"`);
    } catch (error) {
      // Rollback on error
      set({ archives: previousArchives, operationInProgress: null });

      const message = error instanceof Error ? error.message : 'Failed to rename archive';
      toast.error(message);
      throw error;
    }
  },

  // Delete an archive
  deleteArchive: async (archiveName: string) => {
    const previousArchives = get().archives;
    const archiveToDelete = previousArchives.find((a) => a.archiveName === archiveName);

    if (!archiveToDelete) {
      toast.error('Archive not found');
      return;
    }

    set({ operationInProgress: 'delete-archive' });

    try {
      // Optimistically remove the archive
      const updatedArchives = previousArchives.filter((a) => a.archiveName !== archiveName);

      set({
        archives: updatedArchives,
        selectedArchiveId:
          get().selectedArchiveId === archiveToDelete.id ? null : get().selectedArchiveId,
        selectedArchiveMetadata: null,
        archiveDiffContent: null,
      });

      await deleteArchiveByName(archiveName);

      set({ operationInProgress: null });
      toast.success(`Deleted archive "${archiveName}"`);
    } catch (error) {
      // Rollback on error
      set({ archives: previousArchives, operationInProgress: null });

      const message = error instanceof Error ? error.message : 'Failed to delete archive';
      toast.error(message);
      throw error;
    }
  },

  // UI state actions
  setSelectedArchive: (archiveId: string | null) => {
    set({
      selectedArchiveId: archiveId,
      selectedArchiveMetadata: null,
      archiveDiffContent: null,
    });
  },

  reset: () =>
    set({
      archives: [],
      selectedArchiveId: null,
      selectedArchiveMetadata: null,
      archiveDiffContent: null,
      isLoading: false,
      error: null,
      isRestoring: false,
      operationInProgress: null,
    }),
}));
