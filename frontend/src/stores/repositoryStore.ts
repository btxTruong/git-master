import { create } from 'zustand';

export interface Repository {
  path: string;
  name: string;
  currentBranch: string;
  isDetached: boolean;
  lastOpened: string;
}

export interface RepositoryStatus {
  branch: string;
  ahead: number;
  behind: number;
  stagedFiles: string[];
  unstagedFiles: string[];
  untrackedFiles: string[];
  hasConflicts: boolean;
  conflictedFiles: string[];
}

interface RepositoryState {
  currentRepository: Repository | null;
  status: RepositoryStatus | null;
  isLoading: boolean;
  error: string | null;

  setRepository: (repo: Repository | null) => void;
  setStatus: (status: RepositoryStatus | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRepositoryStore = create<RepositoryState>((set) => ({
  currentRepository: null,
  status: null,
  isLoading: false,
  error: null,

  setRepository: (repo) => set({ currentRepository: repo, error: null }),
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));
