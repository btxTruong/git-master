import { create } from 'zustand';
import toast from 'react-hot-toast';
import { GetCommits } from '../../wailsjs/go/services/RepositoryService';

export interface Author {
  name: string;
  email: string;
}

export interface Commit {
  hash: string;
  shortHash: string;
  author: Author;
  committer: Author;
  message: string;
  shortMessage: string;
  date: string;
  parentHashes: string[];
  refs: string[];
  filesChanged: number;
  insertions: number;
  deletions: number;
}

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
  setFilter: (key: keyof CommitFilters, value: string | Date | null) => void;
  clearFilters: () => void;
  reset: () => void;
  setCommits: (commits: Commit[]) => void;
  addCommits: (commits: Commit[]) => void;
  setSelectedCommit: (commit: Commit | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
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
      const newCommits = await GetCommits(pageSize, offset);

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

    // TODO: Integrate with Wails backend when available
    // If commit doesn't have detailed info, fetch it
    // try {
    //   const detailedCommit = await fetchCommitDetails(commit.hash);
    //   set({ selectedCommit: detailedCommit });
    // } catch (error) {
    //   console.error('Failed to load commit details:', error);
    //   // Don't show toast here as the basic commit info is still available
    // }
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

  setCommits: (commits) => set({ commits, error: null }),
  addCommits: (commits) => set((state) => ({ commits: [...state.commits, ...commits] })),
  setSelectedCommit: (commit) => set({ selectedCommit: commit }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setHasMore: (hasMore) => set({ hasMore }),
}));
