import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCommitStore, type Commit } from '@/stores/commitStore';
import { CommitItem } from './CommitItem';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { GitCommit } from 'lucide-react';

/**
 * Optimized commit list with virtualization and memoized callbacks
 */
export function CommitList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { commits, selectedCommit, isLoading, hasMore, currentPage, loadCommits, selectCommit } =
    useCommitStore();

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Each commit row is fixed at 88px tall
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize the select handler to prevent re-creating on each render
  const handleSelectCommit = useCallback(
    (commit: Commit) => {
      selectCommit(commit);
    },
    [selectCommit]
  );

  // Infinite scroll - load more when near bottom
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    // If scrolled to last 5 items and more data available
    if (lastItem.index >= commits.length - 5 && hasMore && !isLoading) {
      loadCommits(currentPage + 1);
    }
  }, [virtualItems, commits.length, hasMore, isLoading, currentPage, loadCommits]);

  // Show empty state when no commits and not loading
  if (commits.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={<GitCommit className="w-16 h-16 text-gray-400" />}
          title="No Commits Found"
          description="This repository doesn't have any commits yet, or the selected filters returned no results."
        />
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const commit = commits[virtualRow.index];
          const isSelected = selectedCommit?.hash === commit.hash;

          return (
            <div
              key={commit.hash}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <CommitItem
                commit={commit}
                isSelected={isSelected}
                onClick={() => handleSelectCommit(commit)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading indicator at bottom */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" text="Loading more commits..." />
        </div>
      )}
    </div>
  );
}
