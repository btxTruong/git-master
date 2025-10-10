# Create Wails API Bindings

## Type
feat

## Description
Create TypeScript wrapper functions for all Wails backend service calls. These wrappers provide type-safe access to Go backend functions, handle errors, and convert data types (e.g., string dates to Date objects).

## Acceptance Criteria
- [ ] API wrapper files created for each service: `repository.ts`, `commit.ts`, `branch.ts`, `diff.ts`, `merge.ts`
- [ ] Each function wraps a Wails backend call with proper error handling
- [ ] Return types match TypeScript Git domain types
- [ ] Date strings converted to Date objects
- [ ] All errors are caught and re-thrown with context
- [ ] Functions are async and return Promises
- [ ] JSDoc comments added for all functions

## Technical Details
- **Files to create**:
  - `frontend/src/api/repository.ts`
  - `frontend/src/api/commit.ts`
  - `frontend/src/api/branch.ts`
  - `frontend/src/api/diff.ts`
  - `frontend/src/api/merge.ts`
  - `frontend/src/api/index.ts` (re-exports)

- **Example implementation** (`api/commit.ts`):
  ```typescript
  import { GetCommits, GetCommitDetail } from '../../wailsjs/go/services/CommitService';
  import type { Commit } from '@/types/git';

  /**
   * Fetch commits from the repository
   * @param limit - Number of commits to fetch
   * @param offset - Offset for pagination
   * @returns Promise<Commit[]>
   */
  export async function fetchCommits(limit: number, offset: number): Promise<Commit[]> {
    try {
      const commits = await GetCommits(limit, offset);
      return commits.map((commit) => ({
        ...commit,
        date: new Date(commit.date), // Convert string to Date
      }));
    } catch (error) {
      console.error('Failed to fetch commits:', error);
      throw new Error(`Failed to fetch commits: ${error}`);
    }
  }

  /**
   * Get details for a specific commit
   * @param hash - Commit hash
   * @returns Promise<Commit>
   */
  export async function fetchCommitDetail(hash: string): Promise<Commit> {
    try {
      const commit = await GetCommitDetail(hash);
      return {
        ...commit,
        date: new Date(commit.date),
      };
    } catch (error) {
      console.error(`Failed to fetch commit ${hash}:`, error);
      throw new Error(`Failed to fetch commit: ${error}`);
    }
  }
  ```

- **API functions to implement**:
  - **Repository**: `openRepository`, `closeRepository`, `getRepoInfo`
  - **Commit**: `fetchCommits`, `fetchCommitDetail`, `searchCommits`
  - **Branch**: `fetchBranches`, `createBranch`, `deleteBranch`, `checkoutBranch`
  - **Diff**: `fetchDiff`, `fetchFileDiff`
  - **Merge**: `mergeBranch`, `getConflicts`, `resolveConflict`, `abortMerge`

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0530-feat-create-git-domain-types.md
- Requires Go backend services to be implemented (may need to mock initially)

## Notes
- Wails generates bindings in `wailsjs/go/` after running `wails dev`
- If Go services don't exist yet, create stub functions that throw "Not implemented"
- Consider adding retry logic for network operations in future phase
- All API calls should be cancelable using AbortController (future enhancement)
