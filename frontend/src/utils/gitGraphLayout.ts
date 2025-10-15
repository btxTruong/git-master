/**
 * Git graph layout algorithm
 * Computes lane positions and connections for commit visualization
 */

import type { Commit } from '@/stores/commitStore';

export interface CommitLaneInfo {
  commitHash: string;
  laneIndex: number;
  hasParentInSameLane: boolean;
  hasChildInSameLane: boolean;
  mergeSourceLanes: number[];
  branchTargetLane: number | null;
  primaryParentLane: number | null;
  activeLanes: Set<number>;
  activeLaneBranches: Map<number, string | null>; // Map of lane index to branch name
  isMergeCommit: boolean;
  parentCount: number;
  branchName: string | null; // Primary branch this commit belongs to
  mergeSourceBranches: string[]; // Branch names for merge sources
}

interface LaneState {
  commitHash: string | null;
  branchName: string | null;
}

const MAX_LANES = 10;

/**
 * Extract primary branch name from commit refs
 * Filters out tags and HEAD, returns the first branch name
 */
function extractBranchName(refs: string[] | undefined): string | null {
  if (!refs || refs.length === 0) return null;

  for (const ref of refs) {
    // Skip HEAD and tags
    if (ref.includes('HEAD') || ref.includes('tag:')) continue;
    // Remove common prefixes
    const cleaned = ref.replace(/^(origin\/|remotes\/origin\/)/,  '');
    return cleaned;
  }

  return null;
}

/**
 * Computes lane layout for a list of commits
 * @param commits - Array of commits in display order (newest first)
 * @returns Map of commit hash to lane information
 */
export function computeGitGraphLayout(commits: Commit[]): Map<string, CommitLaneInfo> {
  const laneInfo = new Map<string, CommitLaneInfo>();
  const lanes: LaneState[] = Array(MAX_LANES)
    .fill(null)
    .map(() => ({ commitHash: null, branchName: null }));

  const commitMap = new Map<string, Commit>();
  commits.forEach((commit) => commitMap.set(commit.hash, commit));

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const activeLanes = new Set<number>();
    const activeLaneBranches = new Map<number, string | null>();
    const commitBranchName = extractBranchName(commit.refs);

    // Find active lanes (lanes that have commits)
    lanes.forEach((lane, index) => {
      if (lane.commitHash !== null) {
        activeLanes.add(index);
        activeLaneBranches.set(index, lane.branchName);
      }
    });

    // Find if this commit is already assigned a lane (from being a parent)
    let assignedLane = lanes.findIndex((lane) => lane.commitHash === commit.hash);

    // If not assigned, find first available lane
    if (assignedLane === -1) {
      assignedLane = lanes.findIndex((lane) => lane.commitHash === null);
      if (assignedLane === -1) {
        assignedLane = lanes.length - 1; // Fallback to last lane
      }
    }

    // Inherit branch name from lane if not explicitly on this commit
    const laneBranchName = lanes[assignedLane]?.branchName;
    const finalBranchName = commitBranchName || laneBranchName;

    activeLanes.add(assignedLane);
    activeLaneBranches.set(assignedLane, finalBranchName);

    // Determine relationships
    const hasChildInSameLane = lanes[assignedLane]?.commitHash === commit.hash;
    const mergeSourceLanes: number[] = [];
    const mergeSourceBranches: string[] = [];
    let primaryParentLane: number | null = null;

    // Clear current lane
    lanes[assignedLane] = { commitHash: null, branchName: null };

    // Assign parent commits to lanes
    const branchTargetLane: number | null = null;
    const parentHashes = commit.parentHashes ?? [];
    parentHashes.forEach((parentHash, index) => {
      if (index === 0) {
        // Primary parent - check if it needs a different lane
        const existingParentLane = lanes.findIndex((lane) => lane.commitHash === parentHash);

        if (existingParentLane !== -1) {
          // Parent already in a different lane - draw curve to it
          primaryParentLane = existingParentLane;
        } else {
          // Parent continues in same lane, inherit branch name
          lanes[assignedLane] = { commitHash: parentHash, branchName: finalBranchName };
          primaryParentLane = assignedLane;
        }
      } else {
        // Merge parents get new lanes
        const parentLane = lanes.findIndex((lane) => lane.commitHash === parentHash);
        if (parentLane !== -1) {
          mergeSourceLanes.push(parentLane);
          // Track the branch name of the merge source
          if (lanes[parentLane]?.branchName) {
            mergeSourceBranches.push(lanes[parentLane].branchName!);
          }
        } else {
          // Find available lane for merge parent
          const newLane = lanes.findIndex((lane) => lane.commitHash === null);
          if (newLane !== -1) {
            // Try to get branch name from parent commit
            const parentCommit = commitMap.get(parentHash);
            const parentBranch = parentCommit ? extractBranchName(parentCommit.refs) : null;
            lanes[newLane] = { commitHash: parentHash, branchName: parentBranch };
            mergeSourceLanes.push(newLane);
            if (parentBranch) {
              mergeSourceBranches.push(parentBranch);
            }
            activeLanes.add(newLane);
            activeLaneBranches.set(newLane, parentBranch);
          }
        }
      }
    });

    // Store lane info
    laneInfo.set(commit.hash, {
      commitHash: commit.hash,
      laneIndex: assignedLane,
      hasParentInSameLane: primaryParentLane === assignedLane,
      hasChildInSameLane,
      mergeSourceLanes,
      branchTargetLane,
      primaryParentLane,
      activeLanes: new Set(activeLanes),
      activeLaneBranches: new Map(activeLaneBranches),
      isMergeCommit: parentHashes.length >= 2,
      parentCount: parentHashes.length,
      branchName: finalBranchName,
      mergeSourceBranches,
    });
  }

  return laneInfo;
}

// Simple hash function for consistent branch coloring
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color for a lane based on branch name
 * Falls back to lane index if branch name is not available
 */
export function getLaneColor(laneIndex: number, isDark: boolean, branchName?: string | null): string {
  const colors = isDark
    ? [
        '#60a5fa', // blue-400
        '#34d399', // green-400
        '#fbbf24', // yellow-400
        '#f87171', // red-400
        '#a78bfa', // purple-400
        '#fb923c', // orange-400
        '#22d3ee', // cyan-400
        '#f472b6', // pink-400
      ]
    : [
        '#3b82f6', // blue-500
        '#10b981', // green-500
        '#f59e0b', // yellow-500
        '#ef4444', // red-500
        '#8b5cf6', // purple-500
        '#f97316', // orange-500
        '#06b6d4', // cyan-500
        '#ec4899', // pink-500
      ];

  // Use branch name for consistent coloring if available
  if (branchName) {
    const index = hashCode(branchName) % colors.length;
    return colors[index];
  }

  // Fallback to lane index
  return colors[laneIndex % colors.length];
}
