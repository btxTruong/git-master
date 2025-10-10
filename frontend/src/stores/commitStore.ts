import { create } from 'zustand';

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

interface CommitState {
  commits: Commit[];
  selectedCommit: Commit | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  setCommits: (commits: Commit[]) => void;
  addCommits: (commits: Commit[]) => void;
  setSelectedCommit: (commit: Commit | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  reset: () => void;
}

export const useCommitStore = create<CommitState>((set) => ({
  commits: [],
  selectedCommit: null,
  isLoading: false,
  error: null,
  hasMore: true,

  setCommits: (commits) => set({ commits, error: null }),
  addCommits: (commits) => set((state) => ({ commits: [...state.commits, ...commits] })),
  setSelectedCommit: (commit) => set({ selectedCommit: commit }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setHasMore: (hasMore) => set({ hasMore }),
  reset: () => set({ commits: [], selectedCommit: null, error: null, hasMore: true }),
}));
