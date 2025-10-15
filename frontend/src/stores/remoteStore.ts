import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { Remote, PullOptions, PushOptions, FetchOptions } from '@/api/remote';
import {
  pull as pullAPI,
  push as pushAPI,
  fetch as fetchAPI,
  getRemotes as getRemotesAPI,
  addRemote as addRemoteAPI,
  removeRemote as removeRemoteAPI,
} from '@/api/remote';

interface RemoteProgress {
  stage: string;
  percentage: number;
  message: string;
}

interface RemoteState {
  remotes: Remote[];
  isPulling: boolean;
  isPushing: boolean;
  isFetching: boolean;
  pullProgress: RemoteProgress | null;
  pushProgress: RemoteProgress | null;
  fetchProgress: RemoteProgress | null;
  error: string | null;

  // Actions
  loadRemotes: () => Promise<void>;
  pull: (options?: PullOptions) => Promise<void>;
  push: (options?: PushOptions) => Promise<void>;
  fetch: (options?: FetchOptions) => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  removeRemote: (name: string) => Promise<void>;
  reset: () => void;
}

export const useRemoteStore = create<RemoteState>((set, get) => ({
  remotes: [],
  isPulling: false,
  isPushing: false,
  isFetching: false,
  pullProgress: null,
  pushProgress: null,
  fetchProgress: null,
  error: null,

  loadRemotes: async () => {
    try {
      const remotes = await getRemotesAPI();
      set({ remotes, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load remotes';
      set({ error: message });
      console.error('Failed to load remotes:', error);
      // Don't show toast for this as it's a background operation
    }
  },

  pull: async (options: PullOptions = {}) => {
    set({ isPulling: true, pullProgress: null, error: null });

    try {
      // Start pull operation
      await pullAPI(options);

      set({
        isPulling: false,
        pullProgress: null,
      });

      toast.success('Pulled changes successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pull changes';
      set({
        error: message,
        isPulling: false,
        pullProgress: null,
      });
      toast.error(message);
      throw error;
    }
  },

  push: async (options: PushOptions = {}) => {
    set({ isPushing: true, pushProgress: null, error: null });

    try {
      // Validate that there are commits to push
      // This would ideally be checked via backend, but for now we'll attempt the push

      // Start push operation
      await pushAPI(options);

      set({
        isPushing: false,
        pushProgress: null,
      });

      toast.success('Pushed changes successfully');

      // Dispatch custom event to notify push button to update counter
      window.dispatchEvent(new CustomEvent('pushCompleted'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to push changes';
      set({
        error: message,
        isPushing: false,
        pushProgress: null,
      });
      toast.error(message);
      throw error;
    }
  },

  fetch: async (options: FetchOptions = {}) => {
    set({ isFetching: true, fetchProgress: null, error: null });

    try {
      await fetchAPI(options);

      set({
        isFetching: false,
        fetchProgress: null,
      });

      toast.success('Fetched changes successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch changes';
      set({
        error: message,
        isFetching: false,
        fetchProgress: null,
      });
      toast.error(message);
      throw error;
    }
  },

  addRemote: async (name: string, url: string) => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      toast.error('Remote name is required');
      return;
    }

    if (!trimmedUrl) {
      toast.error('Remote URL is required');
      return;
    }

    // Check if remote already exists
    const { remotes } = get();
    if (remotes.some((r) => r.name === trimmedName)) {
      toast.error(`Remote "${trimmedName}" already exists`);
      return;
    }

    try {
      await addRemoteAPI(trimmedName, trimmedUrl);

      toast.success(`Added remote "${trimmedName}"`);

      // Reload remotes to get updated list
      await get().loadRemotes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add remote';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  removeRemote: async (name: string) => {
    try {
      await removeRemoteAPI(name);

      toast.success(`Removed remote "${name}"`);

      // Reload remotes to get updated list
      await get().loadRemotes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove remote';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  reset: () =>
    set({
      remotes: [],
      isPulling: false,
      isPushing: false,
      isFetching: false,
      pullProgress: null,
      pushProgress: null,
      fetchProgress: null,
      error: null,
    }),
}));
