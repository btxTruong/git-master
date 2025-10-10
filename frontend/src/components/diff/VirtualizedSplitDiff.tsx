import { useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FileDiff, DiffLine } from '@/types/git';

interface VirtualizedSplitDiffProps {
  fileDiff: FileDiff;
}

export function VirtualizedSplitDiff({ fileDiff }: VirtualizedSplitDiffProps) {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Flatten hunks and lines into arrays for left and right panes
  const { leftLines, rightLines } = useMemo(() => {
    const left: DiffLine[] = [];
    const right: DiffLine[] = [];

    fileDiff.hunks.forEach((hunk) => {
      hunk.lines.forEach((line) => {
        if (line.type !== 'add') {
          left.push(line);
        }
        if (line.type !== 'delete') {
          right.push(line);
        }
      });
    });

    return { leftLines: left, rightLines: right };
  }, [fileDiff.hunks]);

  const leftVirtualizer = useVirtualizer({
    count: leftLines.length,
    getScrollElement: () => leftPaneRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  const rightVirtualizer = useVirtualizer({
    count: rightLines.length,
    getScrollElement: () => rightPaneRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  // Synchronized scrolling
  useEffect(() => {
    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;
    if (!leftPane || !rightPane) return;

    let isLeftScrolling = false;
    let isRightScrolling = false;

    const handleLeftScroll = () => {
      if (isRightScrolling) return;
      isLeftScrolling = true;
      rightPane.scrollTop = leftPane.scrollTop;
      isLeftScrolling = false;
    };

    const handleRightScroll = () => {
      if (isLeftScrolling) return;
      isRightScrolling = true;
      leftPane.scrollTop = rightPane.scrollTop;
      isRightScrolling = false;
    };

    leftPane.addEventListener('scroll', handleLeftScroll);
    rightPane.addEventListener('scroll', handleRightScroll);

    return () => {
      leftPane.removeEventListener('scroll', handleLeftScroll);
      rightPane.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  return (
    <div className="split-diff grid grid-cols-2 gap-px bg-gray-300">
      {/* Left pane: Old file */}
      <div ref={leftPaneRef} className="overflow-auto bg-white font-mono text-sm max-h-[600px]">
        <div className="sticky top-0 bg-red-100 text-red-900 px-4 py-2 text-xs font-semibold border-b border-red-200 z-10">
          Old {fileDiff.oldPath && `(${fileDiff.oldPath})`}
        </div>
        <div
          style={{
            height: `${leftVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {leftVirtualizer.getVirtualItems().map((virtualRow) => {
            const line = leftLines[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={`flex ${
                    line.type === 'delete'
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'bg-white hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="w-12 text-right px-2 text-xs text-gray-500 select-none border-r border-gray-200">
                    {line.oldLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-4 whitespace-pre overflow-x-auto">{line.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right pane: New file */}
      <div ref={rightPaneRef} className="overflow-auto bg-white font-mono text-sm max-h-[600px]">
        <div className="sticky top-0 bg-green-100 text-green-900 px-4 py-2 text-xs font-semibold border-b border-green-200 z-10">
          New ({fileDiff.path})
        </div>
        <div
          style={{
            height: `${rightVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rightVirtualizer.getVirtualItems().map((virtualRow) => {
            const line = rightLines[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={`flex ${
                    line.type === 'add'
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'bg-white hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="w-12 text-right px-2 text-xs text-gray-500 select-none border-r border-gray-200">
                    {line.newLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-4 whitespace-pre overflow-x-auto">{line.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
