import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { StagingFileChange } from '@/types/git';
import {
  getWorkingDirectoryStatus,
  stageFile as stageFileAPI,
  unstageFile as unstageFileAPI,
  stageAllFiles,
  unstageAllFiles,
  commitChanges as commitAPI,
} from '@/api/staging';

interface StagingState {
  stagedFiles: StagingFileChange[];
  unstagedFiles: StagingFileChange[];
  untrackedFiles: StagingFileChange[];
  selectedFile: StagingFileChange | null;
  commitMessage: string;
  isCommitting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadChanges: () => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  commit: (message: string, amend?: boolean) => Promise<void>;
  setSelectedFile: (file: StagingFileChange | null) => void;
  setCommitMessage: (message: string) => void;
  reset: () => void;
}

export const useStagingStore = create<StagingState>((set, get) => ({
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  selectedFile: null,
  commitMessage: '',
  isCommitting: false,
  isLoading: false,
  error: null,

  loadChanges: async () => {
    set({ isLoading: true, error: null });

    try {
      const changes = await getWorkingDirectoryStatus();

      set({
        stagedFiles: changes.stagedFiles,
        unstagedFiles: changes.unstagedFiles,
        untrackedFiles: changes.untrackedFiles,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load changes';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  stageFile: async (path: string) => {
    try {
      await stageFileAPI(path);

      // Reload changes to get updated status
      await get().loadChanges();

      toast.success(`Staged ${path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stage file';
      toast.error(message);
      throw error;
    }
  },

  unstageFile: async (path: string) => {
    try {
      await unstageFileAPI(path);

      // Reload changes to get updated status
      await get().loadChanges();

      toast.success(`Unstaged ${path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unstage file';
      toast.error(message);
      throw error;
    }
  },

  stageAll: async () => {
    try {
      await stageAllFiles();

      // Reload changes to get updated status
      await get().loadChanges();

      toast.success('Staged all changes');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stage all files';
      toast.error(message);
      throw error;
    }
  },

  unstageAll: async () => {
    try {
      await unstageAllFiles();

      // Reload changes to get updated status
      await get().loadChanges();

      toast.success('Unstaged all changes');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unstage all files';
      toast.error(message);
      throw error;
    }
  },

  commit: async (message: string, amend = false) => {
    const { stagedFiles } = get();

    if (stagedFiles.length === 0) {
      toast.error('No staged files to commit');
      return;
    }

    if (!message.trim()) {
      toast.error('Commit message is required');
      return;
    }

    set({ isCommitting: true, error: null });

    try {
      await commitAPI(message, amend);

      // Clear staged files and commit message after successful commit
      set({
        stagedFiles: [],
        commitMessage: '',
        isCommitting: false,
      });

      toast.success(amend ? 'Amended commit successfully' : 'Committed successfully');

      // Reload changes to get updated working directory status
      await get().loadChanges();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to commit';
      set({ error: errorMessage, isCommitting: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  setSelectedFile: (file) => set({ selectedFile: file }),

  setCommitMessage: (message) => set({ commitMessage: message }),

  reset: () =>
    set({
      stagedFiles: [],
      unstagedFiles: [],
      untrackedFiles: [],
      selectedFile: null,
      commitMessage: '',
      isCommitting: false,
      isLoading: false,
      error: null,
    }),
}));
