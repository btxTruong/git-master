import type { Stash } from '@/types/git';

// TODO: Import Wails bindings when backend service is ready
// import { GetStashes, CreateStash, ApplyStash, DropStash, PopStash } from '../../wailsjs/go/services/StashService';

/**
 * Fetch all stashes
 */
export async function getStashes(): Promise<Stash[]> {
  // TODO: Integrate with Wails backend when available
  // return await GetStashes();

  // Mock data for now
  return Promise.resolve([]);
}

/**
 * Create a new stash
 * @param message - Optional message for the stash
 * @param includeUntracked - Whether to include untracked files
 */
export async function createStash(_message?: string, _includeUntracked = false): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await CreateStash(message || '', includeUntracked);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Apply a stash without removing it from the stash list
 * @param index - The index of the stash to apply
 */
export async function applyStash(_index: number): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await ApplyStash(index);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Apply a stash and remove it from the stash list
 * @param index - The index of the stash to pop
 */
export async function popStash(_index: number): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await PopStash(index);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Drop (delete) a stash
 * @param index - The index of the stash to drop
 */
export async function dropStash(_index: number): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await DropStash(index);

  // Mock implementation
  return Promise.resolve();
}
