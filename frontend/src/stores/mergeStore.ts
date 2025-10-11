import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { ConflictFile } from '@/types/git';
import {
  startMerge as startMergeAPI,
  getConflicts as getConflictsAPI,
  resolveConflict as resolveConflictAPI,
  abortMerge as abortMergeAPI,
  completeMerge as completeMergeAPI,
  isMergeInProgress as isMergeInProgressAPI,
  type MergeOptions,
} from '@/api/merge';

interface MergeState {
  isMerging: boolean;
  sourceBranch: string | null;
  conflicts: ConflictFile[];
  resolvedConflicts: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkMergeStatus: () => Promise<void>;
  startMerge: (sourceBranch: string, options?: Omit<MergeOptions, 'sourceBranch'>) => Promise<void>;
  loadConflicts: () => Promise<void>;
  resolveConflict: (
    filePath: string,
    resolution: 'ours' | 'theirs' | 'custom',
    content?: string
  ) => Promise<void>;
  markConflictResolved: (filePath: string) => void;
  abortMerge: () => Promise<void>;
  completeMerge: (message?: string) => Promise<void>;
  reset: () => void;
}

export const useMergeStore = create<MergeState>((set, get) => ({
  isMerging: false,
  sourceBranch: null,
  conflicts: [],
  resolvedConflicts: new Set<string>(),
  isLoading: false,
  error: null,

  checkMergeStatus: async () => {
    try {
      const inProgress = await isMergeInProgressAPI();

      if (inProgress) {
        // If merge is in progress, load conflicts
        await get().loadConflicts();
      }

      set({ isMerging: inProgress });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check merge status';
      console.error('Failed to check merge status:', error);
      // Don't show toast for this background check
      set({ error: message });
    }
  },

  startMerge: async (sourceBranch: string, options?: Omit<MergeOptions, 'sourceBranch'>) => {
    if (!sourceBranch) {
      toast.error('Source branch is required');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await startMergeAPI({ sourceBranch, ...options });

      if (result.hasConflicts) {
        // Merge has conflicts, load them
        await get().loadConflicts();

        set({
          isMerging: true,
          sourceBranch,
          isLoading: false,
        });

        toast.error(
          `Merge has conflicts. Please resolve ${result.conflictedFiles.length} conflicted file(s).`
        );
      } else if (result.success) {
        // Merge completed successfully without conflicts
        set({
          isMerging: false,
          sourceBranch: null,
          conflicts: [],
          resolvedConflicts: new Set(),
          isLoading: false,
        });

        toast.success(`Successfully merged ${sourceBranch} into current branch`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start merge';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  loadConflicts: async () => {
    set({ isLoading: true, error: null });

    try {
      const conflicts = await getConflictsAPI();

      set({
        conflicts,
        isLoading: false,
        isMerging: conflicts.length > 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load conflicts';
      set({
        error: message,
        isLoading: false,
      });
      console.error('Failed to load conflicts:', error);
    }
  },

  resolveConflict: async (
    filePath: string,
    resolution: 'ours' | 'theirs' | 'custom',
    content?: string
  ) => {
    set({ isLoading: true, error: null });

    try {
      await resolveConflictAPI(filePath, resolution, content);

      // Mark conflict as resolved
      const resolvedConflicts = new Set(get().resolvedConflicts);
      resolvedConflicts.add(filePath);

      // Update conflicts list to mark this file as resolved
      const conflicts = get().conflicts.map((c) =>
        c.path === filePath ? { ...c, resolved: true } : c
      );

      set({
        conflicts,
        resolvedConflicts,
        isLoading: false,
      });

      toast.success(`Resolved conflict in ${filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve conflict';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  markConflictResolved: (filePath: string) => {
    const resolvedConflicts = new Set(get().resolvedConflicts);
    resolvedConflicts.add(filePath);

    const conflicts = get().conflicts.map((c) =>
      c.path === filePath ? { ...c, resolved: true } : c
    );

    set({ conflicts, resolvedConflicts });
  },

  abortMerge: async () => {
    set({ isLoading: true, error: null });

    try {
      await abortMergeAPI();

      set({
        isMerging: false,
        sourceBranch: null,
        conflicts: [],
        resolvedConflicts: new Set(),
        isLoading: false,
      });

      toast.success('Merge aborted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to abort merge';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  completeMerge: async (message?: string) => {
    const { conflicts } = get();

    // Check if all conflicts are resolved
    const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
    if (unresolvedConflicts.length > 0) {
      toast.error(
        `Cannot complete merge: ${unresolvedConflicts.length} unresolved conflict(s) remaining`
      );
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await completeMergeAPI(message);

      set({
        isMerging: false,
        sourceBranch: null,
        conflicts: [],
        resolvedConflicts: new Set(),
        isLoading: false,
      });

      toast.success('Merge completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete merge';
      set({
        error: message,
        isLoading: false,
      });
      toast.error(message);
      throw error;
    }
  },

  reset: () =>
    set({
      isMerging: false,
      sourceBranch: null,
      conflicts: [],
      resolvedConflicts: new Set(),
      isLoading: false,
      error: null,
    }),
}));
