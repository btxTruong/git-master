import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { CherryPickCommit } from '@/types/git';
import {
  cherryPick as cherryPickAPI,
  continueCherryPick as continueCherryPickAPI,
  abortCherryPick as abortCherryPickAPI,
  getCherryPickCommits as getCherryPickCommitsAPI,
} from '@/api/cherryPick';

interface CherryPickStoreState {
  isCherryPicking: boolean;
  selectedCommits: string[];
  availableCommits: CherryPickCommit[];
  sourceBranch: string | null;
  currentCommit: string | null;
  hasConflicts: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCherryPickCommits: (sourceBranch: string) => Promise<void>;
  toggleCommit: (hash: string) => void;
  selectCommits: (hashes: string[]) => void;
  clearSelection: () => void;
  startCherryPick: () => Promise<void>;
  continueCherryPick: () => Promise<void>;
  abortCherryPick: () => Promise<void>;
  reset: () => void;
}

export const useCherryPickStore = create<CherryPickStoreState>((set, get) => ({
  isCherryPicking: false,
  selectedCommits: [],
  availableCommits: [],
  sourceBranch: null,
  currentCommit: null,
  hasConflicts: false,
  isLoading: false,
  error: null,

  loadCherryPickCommits: async (sourceBranch: string) => {
    set({ isLoading: true, error: null, sourceBranch });

    try {
      const commits = await getCherryPickCommitsAPI(sourceBranch);

      set({
        availableCommits: commits,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load commits';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  toggleCommit: (hash: string) => {
    const { selectedCommits } = get();
    const isSelected = selectedCommits.includes(hash);

    set({
      selectedCommits: isSelected
        ? selectedCommits.filter((h) => h !== hash)
        : [...selectedCommits, hash],
    });
  },

  selectCommits: (hashes: string[]) => {
    set({ selectedCommits: hashes });
  },

  clearSelection: () => {
    set({ selectedCommits: [] });
  },

  startCherryPick: async () => {
    const { selectedCommits } = get();

    if (selectedCommits.length === 0) {
      toast.error('No commits selected for cherry-pick');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await cherryPickAPI(selectedCommits);

      set({
        isCherryPicking: true,
        isLoading: false,
      });

      toast.success(
        `Cherry-pick started for ${selectedCommits.length} commit${selectedCommits.length > 1 ? 's' : ''}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cherry-pick commits';
      set({ error: message, isLoading: false, hasConflicts: true });
      toast.error(message);
      throw error;
    }
  },

  continueCherryPick: async () => {
    set({ isLoading: true, error: null });

    try {
      await continueCherryPickAPI();

      toast.success('Cherry-pick continued');

      set({
        hasConflicts: false,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to continue cherry-pick';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  abortCherryPick: async () => {
    set({ isLoading: true, error: null });

    try {
      await abortCherryPickAPI();

      toast.success('Cherry-pick aborted');

      // Reset state after aborting
      get().reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to abort cherry-pick';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  reset: () =>
    set({
      isCherryPicking: false,
      selectedCommits: [],
      availableCommits: [],
      sourceBranch: null,
      currentCommit: null,
      hasConflicts: false,
      isLoading: false,
      error: null,
    }),
}));
