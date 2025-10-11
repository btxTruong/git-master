import { useEffect, useRef } from 'react';
import { Gitgraph, TemplateName, Orientation, Mode } from '@gitgraph/react';
import { useCommitStore, type Commit } from '@/stores/commitStore';
import { useBranchStore } from '@/stores/branchStore';

interface CommitGraphProps {
  className?: string;
}

/**
 * CommitGraph component
 * Renders a visual Git commit graph showing branch structure and commit relationships
 */
export function CommitGraph({ className = '' }: CommitGraphProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const { commits } = useCommitStore();
  const { branches } = useBranchStore();

  useEffect(() => {
    if (!commits || commits.length === 0) return;

    // The graph will be rendered by the Gitgraph component below
    // This effect can be used for any additional setup or cleanup if needed
  }, [commits, branches]);

  // Build graph data structure from commits
  const buildGraphData = () => {
    if (!commits || commits.length === 0) return null;

    // Group commits by branch based on parent relationships
    const branchCommits = new Map<string, Commit[]>();
    const processedHashes = new Set<string>();

    // Start with the current branch
    const currentBranch = branches.find((b) => b.current);
    if (currentBranch) {
      branchCommits.set(currentBranch.name, []);
    }

    // Process commits in chronological order (oldest first)
    const sortedCommits = [...commits].reverse();

    sortedCommits.forEach((commit) => {
      if (processedHashes.has(commit.hash)) return;

      // Find which branch this commit belongs to
      let assignedBranch: string | null = null;

      // Check if any existing branch contains this commit's parent
      for (const [branchName, commits] of branchCommits.entries()) {
        if (commits.some((c) => commit.parentHashes.includes(c.hash))) {
          assignedBranch = branchName;
          break;
        }
      }

      // If no branch found and commit has no parents, create a new branch
      if (!assignedBranch && commit.parentHashes.length === 0) {
        assignedBranch = 'main';
        if (!branchCommits.has(assignedBranch)) {
          branchCommits.set(assignedBranch, []);
        }
      }

      // If still no branch and has parents, it might be on main branch
      if (!assignedBranch && commit.parentHashes.length > 0) {
        assignedBranch = currentBranch?.name || 'main';
        if (!branchCommits.has(assignedBranch)) {
          branchCommits.set(assignedBranch, []);
        }
      }

      if (assignedBranch) {
        branchCommits.get(assignedBranch)?.push(commit);
        processedHashes.add(commit.hash);
      }
    });

    return branchCommits;
  };

  const graphData = buildGraphData();

  if (!commits || commits.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500 text-sm">No commits to display</p>
      </div>
    );
  }

  return (
    <div ref={graphRef} className={`overflow-auto ${className}`}>
      <Gitgraph
        options={{
          template: TemplateName.Metro,
          orientation: Orientation.VerticalReverse,
          reverseArrow: false,
          mode: Mode.Compact,
        }}
      >
        {(gitgraph) => {
          const branchMap = new Map<string, ReturnType<typeof gitgraph.branch>>();

          // Create branches
          if (graphData) {
            for (const [branchName] of graphData.entries()) {
              const branch = gitgraph.branch(branchName);
              branchMap.set(branchName, branch);
            }
          }

          // Add commits to branches
          if (graphData) {
            const sortedCommits = [...commits].reverse();

            sortedCommits.forEach((commit) => {
              // Find which branch this commit belongs to
              for (const [branchName, commits] of graphData.entries()) {
                if (commits.some((c) => c.hash === commit.hash)) {
                  const branch = branchMap.get(branchName);
                  if (branch) {
                    branch.commit({
                      subject: commit.message.split('\n')[0],
                      hash: commit.shortHash,
                      author: `${commit.author.name} <${commit.author.email}>`,
                    });
                  }
                  break;
                }
              }
            });
          }
        }}
      </Gitgraph>
    </div>
  );
}
