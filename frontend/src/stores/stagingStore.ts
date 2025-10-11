import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { FileChange } from '@/types/git';

interface StagingState {
  stagedFiles: FileChange[];
  unstagedFiles: FileChange[];
  untrackedFiles: FileChange[];
  selectedFile: FileChange | null;
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
  setSelectedFile: (file: FileChange | null) => void;
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
      // TODO: Integrate with Wails backend when available
      // const changes = await getWorkingDirectoryStatus();

      // Mock data for now
      const stagedFiles: FileChange[] = [];
      const unstagedFiles: FileChange[] = [];
      const untrackedFiles: FileChange[] = [];

      set({
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
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
      // TODO: Integrate with Wails backend when available
      // await stageFileAPI(path);

      // Move file from unstaged/untracked to staged
      const { unstagedFiles, untrackedFiles, stagedFiles } = get();

      const fileInUnstaged = unstagedFiles.find((f) => f.path === path);
      const fileInUntracked = untrackedFiles.find((f) => f.path === path);
      const fileToStage = fileInUnstaged || fileInUntracked;

      if (!fileToStage) {
        throw new Error(`File not found: ${path}`);
      }

      set({
        stagedFiles: [...stagedFiles, fileToStage],
        unstagedFiles: unstagedFiles.filter((f) => f.path !== path),
        untrackedFiles: untrackedFiles.filter((f) => f.path !== path),
      });

      toast.success(`Staged ${path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stage file';
      toast.error(message);
      throw error;
    }
  },

  unstageFile: async (path: string) => {
    try {
      // TODO: Integrate with Wails backend when available
      // await unstageFileAPI(path);

      // Move file from staged to unstaged
      const { stagedFiles, unstagedFiles } = get();

      const fileToUnstage = stagedFiles.find((f) => f.path === path);
      if (!fileToUnstage) {
        throw new Error(`File not found in staged: ${path}`);
      }

      set({
        stagedFiles: stagedFiles.filter((f) => f.path !== path),
        unstagedFiles: [...unstagedFiles, fileToUnstage],
      });

      toast.success(`Unstaged ${path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unstage file';
      toast.error(message);
      throw error;
    }
  },

  stageAll: async () => {
    try {
      // TODO: Integrate with Wails backend when available
      // await stageAllAPI();

      const { unstagedFiles, untrackedFiles, stagedFiles } = get();

      set({
        stagedFiles: [...stagedFiles, ...unstagedFiles, ...untrackedFiles],
        unstagedFiles: [],
        untrackedFiles: [],
      });

      toast.success('Staged all changes');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stage all files';
      toast.error(message);
      throw error;
    }
  },

  unstageAll: async () => {
    try {
      // TODO: Integrate with Wails backend when available
      // await unstageAllAPI();

      const { stagedFiles, unstagedFiles } = get();

      set({
        stagedFiles: [],
        unstagedFiles: [...unstagedFiles, ...stagedFiles],
      });

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
      // TODO: Integrate with Wails backend when available
      // await commitAPI(message, amend);

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
