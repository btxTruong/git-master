import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { Stash } from '@/types/git';
import {
  getStashes as getStashesAPI,
  createStash as createStashAPI,
  applyStash as applyStashAPI,
  popStash as popStashAPI,
  dropStash as dropStashAPI,
} from '@/api/stash';

interface StashState {
  stashes: Stash[];
  selectedStash: Stash | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStashes: () => Promise<void>;
  createStash: (message?: string, includeUntracked?: boolean) => Promise<void>;
  applyStash: (index: number) => Promise<void>;
  popStash: (index: number) => Promise<void>;
  dropStash: (index: number) => Promise<void>;
  selectStash: (stash: Stash | null) => void;
  reset: () => void;
}

export const useStashStore = create<StashState>((set, get) => ({
  stashes: [],
  selectedStash: null,
  isLoading: false,
  error: null,

  loadStashes: async () => {
    set({ isLoading: true, error: null });

    try {
      const stashes = await getStashesAPI();

      set({
        stashes,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load stashes';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  createStash: async (message?: string, includeUntracked = false) => {
    set({ isLoading: true, error: null });

    try {
      await createStashAPI(message, includeUntracked);

      const stashMessage = message || 'WIP';
      toast.success(`Created stash: ${stashMessage}`);

      // Reload stashes to get updated list
      await get().loadStashes();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create stash';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  applyStash: async (index: number) => {
    set({ isLoading: true, error: null });

    try {
      await applyStashAPI(index);

      toast.success(`Applied stash@{${index}}`);

      // Reload stashes to get updated list (stash list doesn't change with apply)
      await get().loadStashes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply stash';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  popStash: async (index: number) => {
    set({ isLoading: true, error: null });

    try {
      await popStashAPI(index);

      toast.success(`Popped stash@{${index}}`);

      // Clear selected stash if it was the one that was popped
      const { selectedStash } = get();
      if (selectedStash && selectedStash.index === index) {
        set({ selectedStash: null });
      }

      // Reload stashes to get updated list
      await get().loadStashes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pop stash';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  dropStash: async (index: number) => {
    set({ isLoading: true, error: null });

    try {
      await dropStashAPI(index);

      toast.success(`Dropped stash@{${index}}`);

      // Clear selected stash if it was the one that was dropped
      const { selectedStash } = get();
      if (selectedStash && selectedStash.index === index) {
        set({ selectedStash: null });
      }

      // Reload stashes to get updated list
      await get().loadStashes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to drop stash';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  selectStash: (stash: Stash | null) => set({ selectedStash: stash }),

  reset: () =>
    set({
      stashes: [],
      selectedStash: null,
      isLoading: false,
      error: null,
    }),
}));
