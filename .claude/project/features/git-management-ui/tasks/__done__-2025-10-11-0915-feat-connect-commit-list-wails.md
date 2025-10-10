# Connect CommitList to Wails Backend

## Type
feat

## Description
Implement the Wails API bindings for commit operations and integrate them with the commit store. This connects the frontend CommitList to the Go backend's CommitService.

## Acceptance Criteria
- [x] `api/commit.ts` created with all commit API functions
- [x] `fetchCommits()` calls Go backend GetCommits method
- [x] `fetchCommitDetails()` calls Go backend GetCommitDetails method
- [x] Error handling wraps all API calls
- [x] `commitStore.loadCommits()` uses the API functions
- [x] Pagination parameters passed correctly (limit, offset)
- [x] Loading states managed properly
- [x] Errors displayed to user via toast notifications
- [x] No types errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details

**File to create**: `frontend/src/api/commit.ts`

**Implementation**:
```typescript
import { GetCommits, GetCommitDetails } from '../../wailsjs/go/services/CommitService';
import type { Commit } from '@/types/git';

export interface CommitFilters {
  branch?: string;
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
}

export interface FetchCommitsOptions {
  limit: number;
  offset: number;
  filters?: CommitFilters;
}

/**
 * Fetch commits from the repository with pagination
 */
export async function fetchCommits(
  options: FetchCommitsOptions
): Promise<Commit[]> {
  try {
    const { limit, offset, filters } = options;

    // Call Wails-generated Go binding
    const commits = await GetCommits(limit, offset);

    return commits;
  } catch (error) {
    console.error('Failed to fetch commits:', error);
    throw new Error(`Failed to load commits: ${error}`);
  }
}

/**
 * Fetch detailed information for a specific commit
 */
export async function fetchCommitDetails(hash: string): Promise<Commit> {
  try {
    const commit = await GetCommitDetails(hash);
    return commit;
  } catch (error) {
    console.error('Failed to fetch commit details:', error);
    throw new Error(`Failed to load commit ${hash}: ${error}`);
  }
}

/**
 * Search commits by message
 */
export async function searchCommits(
  query: string,
  limit = 100
): Promise<Commit[]> {
  try {
    // This will call the backend SearchCommits method
    // For now, we'll use GetCommits and filter client-side
    // TODO: Implement backend SearchCommits method
    const commits = await GetCommits(limit, 0);
    return commits.filter((commit) =>
      commit.subject.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Failed to search commits:', error);
    throw new Error(`Failed to search commits: ${error}`);
  }
}
```

**Update commit store** (`frontend/src/stores/commitStore.ts`):

```typescript
import { create } from 'zustand';
import { fetchCommits, fetchCommitDetails } from '@/api/commit';
import type { Commit } from '@/types/git';
import toast from 'react-hot-toast';

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
  pageSize: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  filters: CommitFilters;

  // Actions
  loadCommits: (page: number) => Promise<void>;
  selectCommit: (commit: Commit) => Promise<void>;
  setFilter: (key: keyof CommitFilters, value: any) => void;
  clearFilters: () => void;
  reset: () => void;
}

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
  pageSize: 100,
  isLoading: false,
  hasMore: true,
  error: null,
  filters: initialFilters,

  loadCommits: async (page: number) => {
    const { pageSize, commits, isLoading } = get();

    // Prevent concurrent loads
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const offset = page * pageSize;
      const newCommits = await fetchCommits({
        limit: pageSize,
        offset,
        filters: get().filters,
      });

      // If page 0, replace commits; otherwise append
      const updatedCommits = page === 0 ? newCommits : [...commits, ...newCommits];

      set({
        commits: updatedCommits,
        currentPage: page,
        hasMore: newCommits.length === pageSize, // If we got full page, there might be more
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load commits';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  selectCommit: async (commit: Commit) => {
    set({ selectedCommit: commit });

    // If commit doesn't have detailed info, fetch it
    if (!commit.changedFiles || commit.changedFiles.length === 0) {
      try {
        const detailedCommit = await fetchCommitDetails(commit.hash);
        set({ selectedCommit: detailedCommit });
      } catch (error) {
        console.error('Failed to load commit details:', error);
        toast.error('Failed to load commit details');
      }
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));

    // Reload commits with new filter
    get().loadCommits(0);
  },

  clearFilters: () => {
    set({ filters: initialFilters });
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
3 hours

## Dependencies
- Depends on: 2025-10-11-0615-feat-create-commit-store.md
- Depends on: 2025-10-11-0545-feat-create-wails-api-bindings.md
- Requires: Backend CommitService implemented

## Notes
- Wails generates TypeScript bindings from Go code
- Bindings are in `wailsjs/go/services/CommitService.js`
- Error messages should be user-friendly
- Toast notifications require react-hot-toast installed
- Pagination uses limit/offset pattern
- Search is initially client-side, will be moved to backend later
- Store handles both loading new pages and replacing on filter change
