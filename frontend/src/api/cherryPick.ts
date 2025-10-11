import type { CherryPickCommit } from '@/types/git';

// TODO: Import Wails bindings when backend service is ready
// import { CherryPick, ContinueCherryPick, AbortCherryPick } from '../../wailsjs/go/services/CherryPickService';

/**
 * Cherry-pick one or more commits onto the current branch
 * @param commitHashes - Array of commit hashes to cherry-pick
 */
export async function cherryPick(_commitHashes: string[]): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await CherryPick(commitHashes);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Continue cherry-pick after resolving conflicts
 */
export async function continueCherryPick(): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await ContinueCherryPick();

  // Mock implementation
  return Promise.resolve();
}

/**
 * Abort the current cherry-pick operation
 */
export async function abortCherryPick(): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await AbortCherryPick();

  // Mock implementation
  return Promise.resolve();
}

/**
 * Get commits available for cherry-picking from a specific branch
 * @param sourceBranch - The branch to get commits from
 */
export async function getCherryPickCommits(_sourceBranch: string): Promise<CherryPickCommit[]> {
  // TODO: Integrate with Wails backend when available
  // return await GetCherryPickCommits(sourceBranch);

  // Mock data for now
  return Promise.resolve([]);
}
