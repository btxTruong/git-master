import { create } from 'zustand';
import { models } from '../../wailsjs/go/models';

export interface RepositoryState {
  currentRepository: models.Repository | null;
  status: models.RepositoryStatus | null;
  isLoading: boolean;
  error: string | null;

  setRepository: (repo: models.Repository | null) => void;
  setStatus: (status: models.RepositoryStatus | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRepositoryStore = create<RepositoryState>((set) => ({
  currentRepository: null,
  status: null,
  isLoading: false,
  error: null,

  setRepository: (repo: models.Repository | null) => set({ currentRepository: repo, error: null }),
  setStatus: (status: models.RepositoryStatus | null) => set({ status }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error, isLoading: false }),
}));
