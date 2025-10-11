import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { RebaseCommit, RebaseAction } from '@/types/git';
import {
  startRebase as startRebaseAPI,
  continueRebase as continueRebaseAPI,
  abortRebase as abortRebaseAPI,
  skipRebase as skipRebaseAPI,
  getRebaseCommits as getRebaseCommitsAPI,
} from '@/api/rebase';

interface RebaseStoreState {
  isRebasing: boolean;
  commits: RebaseCommit[];
  currentCommit: string | null;
  targetBranch: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRebaseCommits: (targetBranch: string) => Promise<void>;
  updateCommitAction: (hash: string, action: RebaseAction) => void;
  startRebase: () => Promise<void>;
  continueRebase: () => Promise<void>;
  abortRebase: () => Promise<void>;
  skipRebase: () => Promise<void>;
  reset: () => void;
}

export const useRebaseStore = create<RebaseStoreState>((set, get) => ({
  isRebasing: false,
  commits: [],
  currentCommit: null,
  targetBranch: null,
  isLoading: false,
  error: null,

  loadRebaseCommits: async (targetBranch: string) => {
    set({ isLoading: true, error: null, targetBranch });

    try {
      const commits = await getRebaseCommitsAPI(targetBranch);

      set({
        commits,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load rebase commits';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  updateCommitAction: (hash: string, action: RebaseAction) => {
    const { commits } = get();
    const updatedCommits = commits.map((commit) =>
      commit.hash === hash ? { ...commit, action } : commit
    );
    set({ commits: updatedCommits });
  },

  startRebase: async () => {
    const { targetBranch, commits } = get();

    if (!targetBranch) {
      toast.error('No target branch specified');
      return;
    }

    if (commits.length === 0) {
      toast.error('No commits to rebase');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await startRebaseAPI(targetBranch, commits);

      set({
        isRebasing: true,
        isLoading: false,
      });

      toast.success('Rebase started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start rebase';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  continueRebase: async () => {
    set({ isLoading: true, error: null });

    try {
      await continueRebaseAPI();

      toast.success('Rebase continued');

      // Reset state after successful rebase
      get().reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to continue rebase';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  abortRebase: async () => {
    set({ isLoading: true, error: null });

    try {
      await abortRebaseAPI();

      toast.success('Rebase aborted');

      // Reset state after aborting rebase
      get().reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to abort rebase';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  skipRebase: async () => {
    set({ isLoading: true, error: null });

    try {
      await skipRebaseAPI();

      toast.success('Commit skipped');

      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to skip commit';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  reset: () =>
    set({
      isRebasing: false,
      commits: [],
      currentCommit: null,
      targetBranch: null,
      isLoading: false,
      error: null,
    }),
}));
