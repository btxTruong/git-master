import type { Commit } from '@/stores/commitStore';
import type { Branch } from '@/types/git';

/**
 * Represents a node in the commit graph
 */
export interface GraphNode {
  commit: Commit;
  branchName: string;
  children: string[]; // Child commit hashes
  parents: string[]; // Parent commit hashes
  depth: number; // Distance from root
  column: number; // Visual column position for rendering
}

/**
 * Represents the complete commit graph structure
 */
export interface CommitGraph {
  nodes: Map<string, GraphNode>;
  branches: Map<string, GraphNode[]>;
  columns: number; // Total number of columns needed for rendering
  rootNodes: GraphNode[]; // Nodes with no parents
}

/**
 * Build a commit graph data structure from commit history and branches
 *
 * This algorithm:
 * 1. Creates nodes for each commit
 * 2. Links parents and children
 * 3. Assigns commits to branches based on parent relationships
 * 4. Calculates optimal column positions for visual rendering
 *
 * @param commits Array of commits (should be sorted by date, newest first)
 * @param branches Array of branches
 * @returns Complete commit graph structure
 */
export function buildCommitGraph(commits: Commit[], branches: Branch[]): CommitGraph {
  const nodes = new Map<string, GraphNode>();
  const branchNodes = new Map<string, GraphNode[]>();
  const rootNodes: GraphNode[] = [];

  // Step 1: Create all nodes
  commits.forEach((commit) => {
    const node: GraphNode = {
      commit,
      branchName: '', // Will be assigned later
      children: [],
      parents: commit.parentHashes,
      depth: 0,
      column: 0,
    };
    nodes.set(commit.hash, node);
  });

  // Step 2: Link children to parents
  commits.forEach((commit) => {
    const node = nodes.get(commit.hash);
    if (!node) return;

    commit.parentHashes.forEach((parentHash) => {
      const parent = nodes.get(parentHash);
      if (parent) {
        parent.children.push(commit.hash);
      }
    });

    // Track root nodes (commits with no parents in this set)
    if (commit.parentHashes.length === 0 || commit.parentHashes.every((h) => !nodes.has(h))) {
      rootNodes.push(node);
    }
  });

  // Step 3: Assign branches to commits
  // Find current branch
  const currentBranch = branches.find((b) => b.current);
  const mainBranch = currentBranch || branches[0] || { name: 'main' };

  // Start with root nodes and traverse
  const processedHashes = new Set<string>();
  const queue: Array<{ hash: string; branchName: string }> = [];

  // Initialize with root nodes
  rootNodes.forEach((node) => {
    const branchName = mainBranch.name;
    queue.push({ hash: node.commit.hash, branchName });
  });

  // BFS to assign branch names
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || processedHashes.has(item.hash)) continue;

    const node = nodes.get(item.hash);
    if (!node) continue;

    node.branchName = item.branchName;
    processedHashes.add(item.hash);

    // Add to branch map
    if (!branchNodes.has(item.branchName)) {
      branchNodes.set(item.branchName, []);
    }
    branchNodes.get(item.branchName)?.push(node);

    // Process children
    node.children.forEach((childHash) => {
      if (!processedHashes.has(childHash)) {
        const child = nodes.get(childHash);
        if (child) {
          // If child has multiple parents, it might be a merge
          // Keep it on the same branch for simplicity
          queue.push({ hash: childHash, branchName: item.branchName });
        }
      }
    });
  }

  // Step 4: Calculate depths (distance from root)
  const calculateDepth = (hash: string, visited = new Set<string>()): number => {
    if (visited.has(hash)) return 0;
    visited.add(hash);

    const node = nodes.get(hash);
    if (!node || node.parents.length === 0) return 0;

    const parentDepths = node.parents
      .map((p) => calculateDepth(p, visited))
      .filter((d) => d !== undefined);

    return parentDepths.length > 0 ? Math.max(...parentDepths) + 1 : 0;
  };

  nodes.forEach((node) => {
    node.depth = calculateDepth(node.commit.hash);
  });

  // Step 5: Calculate column positions for visual layout
  // Simple algorithm: assign column based on branch
  const branchColumns = new Map<string, number>();
  let columnCounter = 0;

  branchNodes.forEach((_, branchName) => {
    branchColumns.set(branchName, columnCounter++);
  });

  nodes.forEach((node) => {
    node.column = branchColumns.get(node.branchName) || 0;
  });

  return {
    nodes,
    branches: branchNodes,
    columns: columnCounter,
    rootNodes,
  };
}

/**
 * Get topologically sorted commits from the graph
 * (parents always appear before children)
 *
 * @param graph Commit graph
 * @returns Array of commits in topological order
 */
export function getTopologicalSort(graph: CommitGraph): Commit[] {
  const result: Commit[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (hash: string): void => {
    if (visited.has(hash)) return;
    if (visiting.has(hash)) {
      // Cycle detected - shouldn't happen in a valid git graph
      console.warn('Cycle detected in commit graph');
      return;
    }

    visiting.add(hash);

    const node = graph.nodes.get(hash);
    if (node) {
      // Visit all parents first
      node.parents.forEach((parentHash) => {
        visit(parentHash);
      });

      visited.add(hash);
      visiting.delete(hash);
      result.push(node.commit);
    }
  };

  // Start from root nodes
  graph.rootNodes.forEach((root) => {
    visit(root.commit.hash);
  });

  // Visit any remaining unvisited nodes (in case of disconnected components)
  graph.nodes.forEach((node) => {
    if (!visited.has(node.commit.hash)) {
      visit(node.commit.hash);
    }
  });

  return result;
}

/**
 * Find the path between two commits in the graph
 *
 * @param graph Commit graph
 * @param fromHash Starting commit hash
 * @param toHash Ending commit hash
 * @returns Array of commits representing the path, or null if no path exists
 */
export function findPath(graph: CommitGraph, fromHash: string, toHash: string): Commit[] | null {
  const startNode = graph.nodes.get(fromHash);
  const endNode = graph.nodes.get(toHash);

  if (!startNode || !endNode) return null;

  const queue: Array<{ hash: string; path: string[] }> = [{ hash: fromHash, path: [fromHash] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (current.hash === toHash) {
      return current.path.map((h) => graph.nodes.get(h)?.commit).filter(Boolean) as Commit[];
    }

    if (visited.has(current.hash)) continue;
    visited.add(current.hash);

    const node = graph.nodes.get(current.hash);
    if (node) {
      // Search through children
      node.children.forEach((childHash) => {
        if (!visited.has(childHash)) {
          queue.push({
            hash: childHash,
            path: [...current.path, childHash],
          });
        }
      });

      // Search through parents
      node.parents.forEach((parentHash) => {
        if (!visited.has(parentHash)) {
          queue.push({
            hash: parentHash,
            path: [...current.path, parentHash],
          });
        }
      });
    }
  }

  return null;
}

/**
 * Get all commits reachable from a specific commit
 *
 * @param graph Commit graph
 * @param hash Starting commit hash
 * @param direction 'forward' for descendants, 'backward' for ancestors, 'both' for all reachable
 * @returns Array of reachable commits
 */
export function getReachableCommits(
  graph: CommitGraph,
  hash: string,
  direction: 'forward' | 'backward' | 'both' = 'both'
): Commit[] {
  const node = graph.nodes.get(hash);
  if (!node) return [];

  const visited = new Set<string>();
  const result: Commit[] = [];

  const traverse = (currentHash: string): void => {
    if (visited.has(currentHash)) return;
    visited.add(currentHash);

    const current = graph.nodes.get(currentHash);
    if (!current) return;

    result.push(current.commit);

    if (direction === 'forward' || direction === 'both') {
      current.children.forEach(traverse);
    }

    if (direction === 'backward' || direction === 'both') {
      current.parents.forEach(traverse);
    }
  };

  traverse(hash);
  return result;
}
