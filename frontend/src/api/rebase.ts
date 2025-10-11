import type { RebaseCommit } from '@/types/git';

// TODO: Import Wails bindings when backend service is ready
// import { StartRebase, ContinueRebase, AbortRebase, SkipRebase } from '../../wailsjs/go/services/RebaseService';

/**
 * Start an interactive rebase
 * @param targetBranch - The branch to rebase onto
 * @param commits - List of commits with their actions
 */
export async function startRebase(_targetBranch: string, _commits: RebaseCommit[]): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await StartRebase(targetBranch, commits);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Continue the rebase after resolving conflicts
 */
export async function continueRebase(): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await ContinueRebase();

  // Mock implementation
  return Promise.resolve();
}

/**
 * Abort the current rebase
 */
export async function abortRebase(): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await AbortRebase();

  // Mock implementation
  return Promise.resolve();
}

/**
 * Skip the current commit during rebase
 */
export async function skipRebase(): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await SkipRebase();

  // Mock implementation
  return Promise.resolve();
}

/**
 * Get commits for interactive rebase
 * @param targetBranch - The branch to rebase onto
 */
export async function getRebaseCommits(_targetBranch: string): Promise<RebaseCommit[]> {
  // TODO: Integrate with Wails backend when available
  // return await GetRebaseCommits(targetBranch);

  // Mock data for now
  return Promise.resolve([]);
}
