import type { Branch } from '@/types/git';

// TODO: Import Wails bindings when backend service is ready
// import { GetBranches, CreateBranch, DeleteBranch, CheckoutBranch } from '../../wailsjs/go/services/BranchService';

/**
 * Fetch all branches (local and remote)
 */
export async function getBranches(): Promise<Branch[]> {
  // TODO: Integrate with Wails backend when available
  // return await GetBranches();

  // Mock data for now
  return Promise.resolve([]);
}

/**
 * Create a new branch
 * @param name - The name of the new branch
 * @param from - The base commit/branch to create from (defaults to current branch)
 * @param checkout - Whether to checkout the new branch after creation
 */
export async function createBranch(
  _name: string,
  _from?: string,
  _checkout = false
): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await CreateBranch(name, from || '', checkout);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Delete a branch
 * @param name - The name of the branch to delete
 * @param force - Force delete even if not fully merged
 */
export async function deleteBranch(_name: string, _force = false): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await DeleteBranch(name, force);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Checkout a branch
 * @param name - The name of the branch to checkout
 */
export async function checkoutBranch(_name: string): Promise<void> {
  // TODO: Integrate with Wails backend when available
  // return await CheckoutBranch(name);

  // Mock implementation
  return Promise.resolve();
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  // TODO: Integrate with Wails backend when available
  // const branches = await GetBranches();
  // const currentBranch = branches.find(b => b.current);
  // return currentBranch?.name || 'main';

  // Mock implementation
  return Promise.resolve('main');
}
