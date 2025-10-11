import { useRef, useEffect, useMemo } from 'react';
import { computeInlineDiff, type InlineDiffSegment } from '@/utils/inlineDiff';
import { computeLineDiff, findChangeGroups, type DiffChange } from '@/utils/lineDiff';

interface FullFileSplitDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName: string;
  isLoading?: boolean;
}

interface DiffLine extends DiffChange {
  segments?: InlineDiffSegment[];
}

export function FullFileSplitDiffViewer({
  oldContent,
  newContent,
  fileName,
  isLoading,
}: FullFileSplitDiffViewerProps) {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Compute diff with inline highlights
  const { oldLines, newLines } = useMemo(() => {
    if (!oldContent && !newContent) {
      return { oldLines: [], newLines: [] };
    }

    // Use proper LCS-based diff algorithm
    const changes = computeLineDiff(oldContent, newContent);

    // Find groups of consecutive changes for inline diff computation
    const changeGroups = findChangeGroups(changes);

    // Enhance changes with inline diffs for modified lines
    const enhancedChanges: DiffLine[] = changes.map((change) => ({ ...change }));

    changeGroups.forEach((group) => {
      const { deleteIndices, addIndices } = group;

      // Pair up delete and add lines for inline diff
      const pairCount = Math.min(deleteIndices.length, addIndices.length);

      for (let i = 0; i < pairCount; i++) {
        const deleteIdx = deleteIndices[i];
        const addIdx = addIndices[i];

        const deleteLine = enhancedChanges[deleteIdx];
        const addLine = enhancedChanges[addIdx];

        // Compute inline diff between these two lines
        const { oldSegments, newSegments } = computeInlineDiff(deleteLine.content, addLine.content);

        enhancedChanges[deleteIdx].segments = oldSegments;
        enhancedChanges[addIdx].segments = newSegments;
      }
    });

    // Separate into old and new lines
    const oldLines: DiffLine[] = [];
    const newLines: DiffLine[] = [];

    enhancedChanges.forEach((change) => {
      if (change.type === 'delete') {
        oldLines.push(change);
      } else if (change.type === 'add') {
        newLines.push(change);
      } else {
        // Context line - add to both sides
        oldLines.push(change);
        newLines.push(change);
      }
    });

    return { oldLines, newLines };
  }, [oldContent, newContent]);

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

  const renderLineContent = (line: DiffLine, side: 'old' | 'new') => {
    if (line.segments) {
      const isDelete = side === 'old' && line.type === 'delete';
      const isAdd = side === 'new' && line.type === 'add';

      return (
        <span className="whitespace-pre-wrap break-all">
          {line.segments.map((segment, i) => {
            if (segment.type === 'delete' && isDelete) {
              return (
                <span key={i} className="bg-red-300 dark:bg-red-800">
                  {segment.text}
                </span>
              );
            }
            if (segment.type === 'insert' && isAdd) {
              return (
                <span key={i} className="bg-green-300 dark:bg-green-800">
                  {segment.text}
                </span>
              );
            }
            return <span key={i}>{segment.text}</span>;
          })}
        </span>
      );
    }

    return <span className="whitespace-pre-wrap break-all">{line.content}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading full file...</div>
      </div>
    );
  }

  if (oldLines.length === 0 && newLines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">No content</div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-2 gap-px bg-gray-300 dark:bg-gray-700">
      {/* Left pane: Old file */}
      <div ref={leftPaneRef} className="overflow-auto bg-white dark:bg-gray-900 font-mono text-sm">
        <div className="sticky top-0 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-300 px-4 py-2 text-xs font-semibold border-b border-red-200 dark:border-red-800 z-10">
          Old: {fileName}
        </div>
        {oldLines.map((line, index) => {
          const bgColor =
            line.type === 'delete'
              ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
              : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
          const textColor =
            line.type === 'delete'
              ? 'text-red-900 dark:text-red-100'
              : 'text-gray-800 dark:text-gray-200';

          return (
            <div key={index} className={`flex ${bgColor} ${textColor} transition-colors`}>
              <div className="w-12 text-right px-2 text-xs text-gray-500 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">
                {line.oldLineNumber ?? ''}
              </div>
              <div className="flex-1 px-4 py-0.5">{renderLineContent(line, 'old')}</div>
            </div>
          );
        })}
      </div>

      {/* Right pane: New file */}
      <div ref={rightPaneRef} className="overflow-auto bg-white dark:bg-gray-900 font-mono text-sm">
        <div className="sticky top-0 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-300 px-4 py-2 text-xs font-semibold border-b border-green-200 dark:border-green-800 z-10">
          New: {fileName}
        </div>
        {newLines.map((line, index) => {
          const bgColor =
            line.type === 'add'
              ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
              : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
          const textColor =
            line.type === 'add'
              ? 'text-green-900 dark:text-green-100'
              : 'text-gray-800 dark:text-gray-200';

          return (
            <div key={index} className={`flex ${bgColor} ${textColor} transition-colors`}>
              <div className="w-12 text-right px-2 text-xs text-gray-500 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">
                {line.newLineNumber ?? ''}
              </div>
              <div className="flex-1 px-4 py-0.5">{renderLineContent(line, 'new')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
