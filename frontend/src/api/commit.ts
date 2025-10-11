import type { DiffResult } from '@/types/git';

export async function fetchCommitDiff(_hash: string): Promise<DiffResult> {
  try {
    // TODO: Integrate with Wails backend when available
    // import { GetCommitDiff } from '../../wailsjs/go/services/CommitService';
    // const diff = await GetCommitDiff(hash);

    // Mock data for now
    return {
      files: [],
    };
  } catch (error) {
    console.error('Failed to fetch commit diff:', error);
    throw error;
  }
}
