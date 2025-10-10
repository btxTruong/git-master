import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCommitStore } from '@/stores/commitStore';
import { CommitItem } from './CommitItem';
import { Spinner } from '@/components/common/Spinner';

export function CommitList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { commits, selectedCommit, isLoading, hasMore, currentPage, loadCommits, selectCommit } =
    useCommitStore();

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Each commit row is ~60px tall
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll - load more when near bottom
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    // If scrolled to last 5 items and more data available
    if (lastItem.index >= commits.length - 5 && hasMore && !isLoading) {
      loadCommits(currentPage + 1);
    }
  }, [virtualItems, commits.length, hasMore, isLoading, currentPage, loadCommits]);

  return (
    <div ref={parentRef} className="flex-1 overflow-auto" style={{ contain: 'strict' }}>
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
                onClick={() => selectCommit(commit)}
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

      {/* End of list indicator */}
      {!hasMore && commits.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">End of commit history</div>
      )}
    </div>
  );
}
