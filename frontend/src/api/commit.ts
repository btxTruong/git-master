import { GetCommits, GetCommitDetail } from '../../wailsjs/go/services/RepositoryService';
import type { Commit } from '@/stores/commitStore';

export interface CommitFilters {
  branch?: string | null;
  author?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  searchText?: string;
}

export interface FetchCommitsOptions {
  limit: number;
  offset: number;
  filters?: CommitFilters;
}

/**
 * Fetch commits from the repository with pagination
 */
export async function fetchCommits(options: FetchCommitsOptions): Promise<Commit[]> {
  try {
    const { limit, offset } = options;

    // Call Wails-generated Go binding
    const commits = await GetCommits(limit, offset);

    return commits;
  } catch (error) {
    console.error('Failed to fetch commits:', error);
    throw new Error(`Failed to load commits: ${error}`);
  }
}

/**
 * Fetch detailed information for a specific commit
 */
export async function fetchCommitDetails(hash: string): Promise<Commit> {
  try {
    const commit = await GetCommitDetail(hash);
    return commit;
  } catch (error) {
    console.error('Failed to fetch commit details:', error);
    throw new Error(`Failed to load commit ${hash}: ${error}`);
  }
}

/**
 * Search commits by message
 */
export async function searchCommits(query: string, limit = 100): Promise<Commit[]> {
  try {
    // This will call the backend SearchCommits method
    // For now, we'll use GetCommits and filter client-side
    // TODO: Implement backend SearchCommits method
    const commits = await GetCommits(limit, 0);
    return commits.filter(
      (commit) =>
        commit.message.toLowerCase().includes(query.toLowerCase()) ||
        commit.shortMessage.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Failed to search commits:', error);
    throw new Error(`Failed to search commits: ${error}`);
  }
}
