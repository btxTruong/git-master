/**
 * Merge operations API
 * Bindings for Git merge operations
 */

import type { ConflictFile } from '@/types/git';

// Placeholder functions - will be connected to Wails backend when MergeService is implemented

export interface MergeOptions {
  sourceBranch: string;
  noFastForward?: boolean;
  squash?: boolean;
}

export interface MergeResult {
  success: boolean;
  hasConflicts: boolean;
  conflictedFiles: string[];
  message?: string;
}

/**
 * Start a merge operation
 */
export async function startMerge(_options: MergeOptions): Promise<MergeResult> {
  // TODO: Connect to Wails backend MergeService.StartMerge when implemented
  throw new Error('Merge operation not yet implemented in backend');
}

/**
 * Get list of conflicted files
 */
export async function getConflicts(): Promise<ConflictFile[]> {
  // TODO: Connect to Wails backend MergeService.GetConflicts when implemented
  return [];
}

/**
 * Resolve a conflict by accepting one side
 */
export async function resolveConflict(
  _filePath: string,
  _resolution: 'ours' | 'theirs' | 'custom',
  _content?: string
): Promise<void> {
  // TODO: Connect to Wails backend MergeService.ResolveConflict when implemented
  throw new Error('Resolve conflict operation not yet implemented in backend');
}

/**
 * Abort the current merge
 */
export async function abortMerge(): Promise<void> {
  // TODO: Connect to Wails backend MergeService.AbortMerge when implemented
  throw new Error('Abort merge operation not yet implemented in backend');
}

/**
 * Complete the merge after all conflicts are resolved
 */
export async function completeMerge(_message?: string): Promise<void> {
  // TODO: Connect to Wails backend MergeService.CompleteMerge when implemented
  throw new Error('Complete merge operation not yet implemented in backend');
}

/**
 * Check if a merge is in progress
 */
export async function isMergeInProgress(): Promise<boolean> {
  // TODO: Connect to Wails backend MergeService.IsMergeInProgress when implemented
  return false;
}
