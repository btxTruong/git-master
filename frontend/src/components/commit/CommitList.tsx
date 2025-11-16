import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCommitStore, type Commit } from '@/stores/commitStore';
import { CommitItem } from './CommitItem';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { GitCommit } from 'lucide-react';
import { computeGitGraphLayout } from '@/utils/gitGraphLayout';

/**
 * Optimized commit list with virtualization and memoized callbacks
 */
export function CommitList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const {
    commits,
    selectedCommit,
    isLoading,
    hasMore,
    currentPage,
    loadCommits,
    selectCommit,
    scrollToCommitHash,
    clearScrollRequest,
  } = useCommitStore();

  // Compute git graph layout for all commits
  const laneInfoMap = useMemo(() => {
    return computeGitGraphLayout(commits);
  }, [commits]);

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Initial estimate for compact view
    getItemKey: (index) => commits[index]?.hash, // Stable keys for size cache
    // Enable dynamic measurement via ResizeObserver for responsive height
    measureElement:
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? (el) => el.getBoundingClientRect().height
        : undefined,
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize the select handler to prevent re-creating on each render
  const handleSelectCommit = useCallback(
    (commit: Commit) => {
      selectCommit(commit);
    },
    [selectCommit]
  );

  const handleOperationComplete = useCallback(() => {
    loadCommits(0);
  }, [loadCommits]);

  // Infinite scroll - load more when near bottom
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    const shouldLoadMore = lastItem.index >= commits.length - 5 && hasMore && !isLoading;

    // If scrolled to last 5 items and more data available
    if (shouldLoadMore) {
      loadCommits(currentPage + 1);
    }
  }, [virtualItems, commits.length, hasMore, isLoading, currentPage, loadCommits]);

  // Handle scroll to commit request
  useEffect(() => {
    if (scrollToCommitHash) {
      const commitIndex = commits.findIndex((c) => c.hash === scrollToCommitHash);
      if (commitIndex !== -1) {
        virtualizer.scrollToIndex(commitIndex, { align: 'center', behavior: 'smooth' });
        clearScrollRequest();
      }
    }
  }, [scrollToCommitHash, commits, virtualizer, clearScrollRequest]);

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
          const laneInfo = laneInfoMap.get(commit.hash);

          return (
            <div
              key={commit.hash}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <CommitItem
                commit={commit}
                isSelected={isSelected}
                onClick={() => handleSelectCommit(commit)}
                onOperationComplete={handleOperationComplete}
                laneInfo={laneInfo}
                showGraph={true}
                allCommits={commits}
                onSelectCommit={handleSelectCommit}
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
