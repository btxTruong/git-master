# Create Repository Zustand Store

## Type
feat

## Description
Create a Zustand store for managing repository state, including the current repository, recent repositories list, and repository-related actions (open, close, add to recent). Implement localStorage persistence for recent repositories.

## Acceptance Criteria
- [ ] `stores/repositoryStore.ts` file created
- [ ] Store includes state: `currentRepo`, `recentRepos`, `isLoading`, `error`
- [ ] Actions implemented: `openRepository`, `closeRepository`, `addToRecent`
- [ ] Recent repositories persisted to localStorage (max 10)
- [ ] Opening a repository calls Wails API and updates state
- [ ] Errors are caught and stored in `error` state
- [ ] Store can be imported and used in components
- [ ] TypeScript types are correct and strict

## Technical Details
- **File to create**: `frontend/src/stores/repositoryStore.ts`

- **Implementation**:
  ```typescript
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';
  import type { Repository } from '@/types/git';
  import { openRepository as apiOpenRepository, getRepoInfo } from '@/api/repository';

  interface RepositoryState {
    currentRepo: Repository | null;
    recentRepos: Repository[];
    isLoading: boolean;
    error: string | null;

    // Actions
    openRepository: (path: string) => Promise<void>;
    closeRepository: () => void;
    addToRecent: (repo: Repository) => void;
    clearError: () => void;
  }

  export const useRepositoryStore = create<RepositoryState>()(
    persist(
      (set, get) => ({
        currentRepo: null,
        recentRepos: [],
        isLoading: false,
        error: null,

        openRepository: async (path: string) => {
          set({ isLoading: true, error: null });
          try {
            await apiOpenRepository(path);
            const repo = await getRepoInfo();
            set({ currentRepo: repo, isLoading: false });
            get().addToRecent(repo);
          } catch (error) {
            set({
              error: `Failed to open repository: ${error}`,
              isLoading: false
            });
            throw error;
          }
        },

        closeRepository: () => {
          set({ currentRepo: null, error: null });
        },

        addToRecent: (repo: Repository) => {
          const { recentRepos } = get();
          const filtered = recentRepos.filter((r) => r.path !== repo.path);
          const updated = [repo, ...filtered].slice(0, 10); // Keep max 10
          set({ recentRepos: updated });
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'repository-storage',
        partialize: (state) => ({ recentRepos: state.recentRepos }),
      }
    )
  );
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0545-feat-create-wails-api-bindings.md

## Notes
- Use `persist` middleware to save `recentRepos` to localStorage
- Only persist `recentRepos`, not `currentRepo` (should reload on app start)
- Max 10 recent repos to avoid cluttering storage
- Consider adding a `removeFromRecent` action for user cleanup
