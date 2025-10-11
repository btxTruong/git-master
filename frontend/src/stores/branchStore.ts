import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { Branch } from '@/types/git';
import {
  getBranches as getBranchesAPI,
  createBranch as createBranchAPI,
  deleteBranch as deleteBranchAPI,
  checkoutBranch as checkoutBranchAPI,
  getCurrentBranch as getCurrentBranchAPI,
} from '@/api/branch';

interface BranchState {
  branches: Branch[];
  currentBranch: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBranches: () => Promise<void>;
  createBranch: (name: string, from?: string, checkout?: boolean) => Promise<void>;
  deleteBranch: (name: string, force?: boolean) => Promise<void>;
  checkoutBranch: (name: string) => Promise<void>;
  setCurrentBranch: (branchName: string) => void;
  reset: () => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  currentBranch: '',
  isLoading: false,
  error: null,

  loadBranches: async () => {
    set({ isLoading: true, error: null });

    try {
      const [branches, currentBranch] = await Promise.all([
        getBranchesAPI(),
        getCurrentBranchAPI(),
      ]);

      set({
        branches,
        currentBranch,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load branches';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  createBranch: async (name: string, from?: string, checkout = false) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Branch name is required');
      return;
    }

    // Validate branch name (basic validation, can be enhanced)
    if (!/^[a-zA-Z0-9/_-]+$/.test(trimmedName)) {
      toast.error('Branch name contains invalid characters');
      return;
    }

    // Check if branch already exists
    const { branches } = get();
    if (branches.some((b) => b.name === trimmedName)) {
      toast.error(`Branch "${trimmedName}" already exists`);
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await createBranchAPI(trimmedName, from, checkout);

      toast.success(`Created branch "${trimmedName}"`);

      // Reload branches to get updated list
      await get().loadBranches();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create branch';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  deleteBranch: async (name: string, force = false) => {
    const { currentBranch } = get();

    // Prevent deleting current branch
    if (name === currentBranch) {
      toast.error('Cannot delete the current branch. Checkout another branch first.');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await deleteBranchAPI(name, force);

      toast.success(`Deleted branch "${name}"`);

      // Reload branches to get updated list
      await get().loadBranches();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete branch';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  checkoutBranch: async (name: string) => {
    const { currentBranch } = get();

    if (name === currentBranch) {
      toast(`Already on branch "${name}"`);
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await checkoutBranchAPI(name);

      set({ currentBranch: name, isLoading: false });

      toast.success(`Switched to branch "${name}"`);

      // Reload branches to get updated list
      await get().loadBranches();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to checkout branch';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  setCurrentBranch: (branchName: string) => set({ currentBranch: branchName }),

  reset: () =>
    set({
      branches: [],
      currentBranch: '',
      isLoading: false,
      error: null,
    }),
}));
