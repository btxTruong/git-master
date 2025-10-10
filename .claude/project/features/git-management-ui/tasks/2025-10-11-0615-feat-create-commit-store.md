# Create Commit Zustand Store

## Type
feat

## Description
Create a Zustand store for managing commit-related state, including the commit list, selected commit, pagination, filters, and search. Implement actions for loading commits, applying filters, and pagination.

## Acceptance Criteria
- [ ] `stores/commitStore.ts` file created
- [ ] Store includes: `commits`, `selectedCommit`, `totalCommits`, `currentPage`, `isLoading`, `filters`
- [ ] Actions implemented: `loadCommits`, `selectCommit`, `setFilter`, `clearFilters`, `loadMore`
- [ ] Pagination works correctly (100 commits per page)
- [ ] Filters include: branch, author, dateFrom, dateTo, searchText
- [ ] Loading state prevents duplicate API calls
- [ ] Store resets when repository changes
- [ ] TypeScript types are strict and correct

## Technical Details
- **File to create**: `frontend/src/stores/commitStore.ts`

- **Implementation**:
  ```typescript
  import { create } from 'zustand';
  import type { Commit } from '@/types/git';
  import { fetchCommits, searchCommits } from '@/api/commit';

  interface CommitFilters {
    branch: string | null;
    author: string | null;
    dateFrom: Date | null;
    dateTo: Date | null;
    searchText: string;
  }

  interface CommitState {
    commits: Commit[];
    selectedCommit: Commit | null;
    totalCommits: number;
    currentPage: number;
    isLoading: boolean;
    hasMore: boolean;
    filters: CommitFilters;

    // Actions
    loadCommits: (page?: number) => Promise<void>;
    loadMore: () => Promise<void>;
    selectCommit: (commit: Commit | null) => void;
    setFilter: <K extends keyof CommitFilters>(
      key: K,
      value: CommitFilters[K]
    ) => void;
    clearFilters: () => void;
    reset: () => void;
  }

  const COMMITS_PER_PAGE = 100;

  const initialFilters: CommitFilters = {
    branch: null,
    author: null,
    dateFrom: null,
    dateTo: null,
    searchText: '',
  };

  export const useCommitStore = create<CommitState>((set, get) => ({
    commits: [],
    selectedCommit: null,
    totalCommits: 0,
    currentPage: 0,
    isLoading: false,
    hasMore: true,
    filters: initialFilters,

    loadCommits: async (page = 0) => {
      const { isLoading, filters } = get();
      if (isLoading) return;

      set({ isLoading: true });

      try {
        const offset = page * COMMITS_PER_PAGE;
        const newCommits = await fetchCommits(COMMITS_PER_PAGE, offset);

        set({
          commits: page === 0 ? newCommits : [...get().commits, ...newCommits],
          currentPage: page,
          hasMore: newCommits.length === COMMITS_PER_PAGE,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to load commits:', error);
        set({ isLoading: false, hasMore: false });
      }
    },

    loadMore: async () => {
      const { currentPage, hasMore, isLoading } = get();
      if (!hasMore || isLoading) return;
      await get().loadCommits(currentPage + 1);
    },

    selectCommit: (commit) => {
      set({ selectedCommit: commit });
    },

    setFilter: (key, value) => {
      set({
        filters: { ...get().filters, [key]: value },
        commits: [],
        currentPage: 0,
        hasMore: true,
      });
      // Reload commits with new filters
      get().loadCommits(0);
    },

    clearFilters: () => {
      set({ filters: initialFilters, commits: [], currentPage: 0 });
      get().loadCommits(0);
    },

    reset: () => {
      set({
        commits: [],
        selectedCommit: null,
        currentPage: 0,
        hasMore: true,
        filters: initialFilters,
      });
    },
  }));
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0545-feat-create-wails-api-bindings.md

## Notes
- Pagination loads 100 commits at a time for optimal performance
- `loadMore` is used for infinite scroll implementation
- Changing filters resets commit list and reloads from page 0
- Consider debouncing `searchText` filter in component (not in store)
- `reset` should be called when repository changes
