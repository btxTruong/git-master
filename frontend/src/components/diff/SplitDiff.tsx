import { useRef, useEffect, useMemo } from 'react';
import type { FileDiff } from '@/types/git';
import { VirtualizedSplitDiff } from './VirtualizedSplitDiff';

interface SplitDiffProps {
  fileDiff: FileDiff;
}

const VIRTUALIZATION_THRESHOLD = 1000;

export function SplitDiff({ fileDiff }: SplitDiffProps) {
  // Calculate total number of lines
  const totalLines = useMemo(() => {
    return fileDiff.hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0);
  }, [fileDiff.hunks]);

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

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

  // Use virtualization for large diffs
  if (totalLines > VIRTUALIZATION_THRESHOLD) {
    return <VirtualizedSplitDiff fileDiff={fileDiff} />;
  }

  // Regular rendering for smaller diffs
  return (
    <div className="split-diff grid grid-cols-2 gap-px bg-gray-300">
      {/* Left pane: Old file */}
      <div ref={leftPaneRef} className="overflow-auto bg-white font-mono text-sm max-h-[600px]">
        <div className="sticky top-0 bg-red-100 text-red-900 px-4 py-2 text-xs font-semibold border-b border-red-200 z-10">
          Old {fileDiff.oldPath && `(${fileDiff.oldPath})`}
        </div>
        {fileDiff.hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex}>
            {hunk.lines
              .filter((line) => line.type !== 'add')
              .map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className={`flex ${
                    line.type === 'delete'
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'bg-white hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="w-12 text-right px-2 text-xs text-gray-500 select-none border-r border-gray-200">
                    {line.oldLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-4 whitespace-pre-wrap break-all">{line.content}</div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Right pane: New file */}
      <div ref={rightPaneRef} className="overflow-auto bg-white font-mono text-sm max-h-[600px]">
        <div className="sticky top-0 bg-green-100 text-green-900 px-4 py-2 text-xs font-semibold border-b border-green-200 z-10">
          New ({fileDiff.path})
        </div>
        {fileDiff.hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex}>
            {hunk.lines
              .filter((line) => line.type !== 'delete')
              .map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className={`flex ${
                    line.type === 'add'
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'bg-white hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="w-12 text-right px-2 text-xs text-gray-500 select-none border-r border-gray-200">
                    {line.newLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-4 whitespace-pre-wrap break-all">{line.content}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
