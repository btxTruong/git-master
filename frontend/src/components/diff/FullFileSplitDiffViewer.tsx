import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { computeInlineDiff, type InlineDiffSegment } from '@/utils/inlineDiff';
import { computeLineDiff, findChangeGroups, type DiffChange } from '@/utils/lineDiff';

const ADDED_LINE_COLOR = 'rgb(175, 244, 192)';
const UPDATE_LINE_COLOR = 'rgb(231, 236, 250)';
const HIGHLIGHT_UPDATE_TEXT_COLOR = 'rgb(193, 211, 242)';

interface FullFileSplitDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName: string;
  isLoading?: boolean;
}

interface DiffLine extends DiffChange {
  segments?: InlineDiffSegment[];
  correlationColor?: string;
  isSpacer?: boolean;
}

export function FullFileSplitDiffViewer({
  oldContent,
  newContent,
  fileName,
  isLoading,
}: FullFileSplitDiffViewerProps) {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute diff with inline highlights, spacers, and correlation colors
  const { oldLines, newLines, changeIndices } = useMemo(() => {
    if (!oldContent && !newContent) {
      return { oldLines: [], newLines: [], changeIndices: [] };
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

        // Mark these as correlated updates
        enhancedChanges[deleteIdx].correlationColor = UPDATE_LINE_COLOR;
        enhancedChanges[addIdx].correlationColor = UPDATE_LINE_COLOR;
      }
    });

    // Build aligned old and new lines with spacers
    const oldLines: DiffLine[] = [];
    const newLines: DiffLine[] = [];
    const changeBlockIndices: number[] = [];
    let inChangeBlock = false;
    let blockStartIndex = -1;

    enhancedChanges.forEach((change) => {
      if (change.type === 'delete') {
        if (!inChangeBlock) {
          inChangeBlock = true;
          blockStartIndex = oldLines.length;
        }
        oldLines.push(change);
        // Add spacer in new file for deleted line
        newLines.push({
          type: 'context',
          oldLineNumber: null,
          newLineNumber: null,
          content: '',
          isSpacer: true,
        });
      } else if (change.type === 'add') {
        if (!inChangeBlock) {
          inChangeBlock = true;
          blockStartIndex = oldLines.length;
        }
        // Add spacer in old file for added line
        oldLines.push({
          type: 'context',
          oldLineNumber: null,
          newLineNumber: null,
          content: '',
          isSpacer: true,
        });
        newLines.push(change);
      } else {
        // Context line - end change block if active
        if (inChangeBlock) {
          changeBlockIndices.push(blockStartIndex);
          inChangeBlock = false;
        }
        oldLines.push(change);
        newLines.push(change);
      }
    });

    // Handle case where file ends with changes
    if (inChangeBlock && blockStartIndex >= 0) {
      changeBlockIndices.push(blockStartIndex);
    }

    return { oldLines, newLines, changeIndices: changeBlockIndices };
  }, [oldContent, newContent]);

  // Derive current change index based on content - resets automatically when content changes
  const contentKey = useMemo(
    () => `${oldContent.length}-${newContent.length}`,
    [oldContent, newContent]
  );
  const [currentChangeIndex, setCurrentChangeIndex] = useState<number>(0);
  const [lastContentKey, setLastContentKey] = useState(contentKey);

  // Reset index when content changes
  if (contentKey !== lastContentKey) {
    setCurrentChangeIndex(0);
    setLastContentKey(contentKey);
  }

  // Single scroll control - both panes scroll together
  useEffect(() => {
    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!leftPane || !rightPane || !scrollContainer) return;

    const handleScroll = () => {
      leftPane.scrollTop = scrollContainer.scrollTop;
      rightPane.scrollTop = scrollContainer.scrollTop;
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Navigation functions
  const navigateToChange = useCallback(
    (changeIdx: number) => {
      if (changeIdx < 0 || changeIdx >= changeIndices.length) return;

      const scrollContainer = scrollContainerRef.current;
      const leftPane = leftPaneRef.current;

      if (!scrollContainer || !leftPane) return;

      const targetLineIndex = changeIndices[changeIdx];
      const targetElement = leftPane.querySelector(`[data-line-index="${targetLineIndex}"]`);

      if (targetElement) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();
        const scrollOffset =
          scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 100;

        scrollContainer.scrollTo({
          top: Math.max(0, scrollOffset),
          behavior: 'smooth',
        });

        setCurrentChangeIndex(changeIdx);
      }
    },
    [changeIndices]
  );

  // Auto-scroll to first change after render
  useEffect(() => {
    if (changeIndices.length > 0) {
      const timer = setTimeout(() => {
        navigateToChange(0);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [changeIndices, navigateToChange]);

  const handlePreviousDiff = () => {
    if (currentChangeIndex > 0) {
      navigateToChange(currentChangeIndex - 1);
    }
  };

  const handleNextDiff = () => {
    if (currentChangeIndex < changeIndices.length - 1) {
      navigateToChange(currentChangeIndex + 1);
    }
  };

  const totalChanges = changeIndices.length;

  const renderLineContent = (line: DiffLine, side: 'old' | 'new') => {
    const isUpdate = line.correlationColor === UPDATE_LINE_COLOR;

    if (line.segments) {
      const isDelete = side === 'old' && line.type === 'delete';
      const isAdd = side === 'new' && line.type === 'add';

      return (
        <span className="whitespace-pre-wrap break-all">
          {line.segments.map((segment, i) => {
            if (segment.type === 'delete' && isDelete && isUpdate) {
              return (
                <span key={i} style={{ backgroundColor: HIGHLIGHT_UPDATE_TEXT_COLOR }}>
                  {segment.text}
                </span>
              );
            }
            if (segment.type === 'insert' && isAdd) {
              const bgColor = isUpdate ? HIGHLIGHT_UPDATE_TEXT_COLOR : ADDED_LINE_COLOR;
              return (
                <span key={i} style={{ backgroundColor: bgColor }}>
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
    <div className="h-full flex flex-col">
      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousDiff}
            disabled={currentChangeIndex === 0 || totalChanges === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            aria-label="Previous Diff"
          >
            <ChevronUp className="w-4 h-4" />
            Previous Diff
          </button>
          <button
            onClick={handleNextDiff}
            disabled={currentChangeIndex >= totalChanges - 1 || totalChanges === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            aria-label="Next Diff"
          >
            <ChevronDown className="w-4 h-4" />
            Next Diff
          </button>
        </div>
        {totalChanges > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Change {currentChangeIndex + 1} of {totalChanges}
          </div>
        )}
      </div>

      {/* Scroll container with split panes */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-px bg-gray-300 dark:bg-gray-700 min-h-full">
          {/* Left pane: Old file */}
          <div
            ref={leftPaneRef}
            className="overflow-hidden bg-white dark:bg-gray-900 font-mono text-sm"
          >
            <div className="sticky top-0 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-300 px-4 py-2 text-xs font-semibold border-b border-red-200 dark:border-red-800 z-10">
              Old: {fileName}
              {!oldContent && newContent ? ' (no previous version)' : ''}
            </div>
            {oldLines.length === 0 && newLines.length > 0 && (
              <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 italic text-center">
                File did not exist in the parent commit.
              </div>
            )}
            {oldLines.map((line, index) => {
              let bgColor = 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
              let textColor = 'text-gray-800 dark:text-gray-200';

              if (line.isSpacer) {
                bgColor = '';
                textColor = '';
              } else if (line.type === 'delete') {
                bgColor = 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
                textColor = 'text-red-900 dark:text-red-100';
              }

              const correlationBarStyle = line.correlationColor
                ? { borderLeftWidth: '3px', borderLeftColor: line.correlationColor }
                : {};

              const inlineStyle = line.isSpacer
                ? { backgroundColor: ADDED_LINE_COLOR, minHeight: '1.5rem' }
                : {};

              return (
                <div
                  key={index}
                  data-line-index={index}
                  className={`flex ${bgColor} ${textColor} transition-colors`}
                  style={inlineStyle}
                >
                  <div className="flex-1 px-4 py-0.5">
                    {line.isSpacer ? '' : renderLineContent(line, 'old')}
                  </div>
                  <div
                    className="w-12 text-left px-2 text-xs text-gray-500 dark:text-gray-500 select-none border-l border-gray-200 dark:border-gray-700"
                    style={correlationBarStyle}
                  >
                    {line.oldLineNumber ?? ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right pane: New file */}
          <div
            ref={rightPaneRef}
            className="overflow-hidden bg-white dark:bg-gray-900 font-mono text-sm"
          >
            <div className="sticky top-0 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-300 px-4 py-2 text-xs font-semibold border-b border-green-200 dark:border-green-800 z-10">
              New: {fileName}
              {oldContent && !newContent ? ' (deleted)' : ''}
            </div>
            {newLines.length === 0 && oldLines.length > 0 && (
              <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 italic text-center">
                File was deleted in this commit.
              </div>
            )}
            {newLines.map((line, index) => {
              let bgColor = 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
              let textColor = 'text-gray-800 dark:text-gray-200';

              if (line.isSpacer) {
                bgColor = '';
                textColor = '';
              } else if (line.type === 'add') {
                textColor = 'text-gray-800 dark:text-gray-200';
              }

              const correlationBarStyle = line.correlationColor
                ? { borderRightWidth: '3px', borderRightColor: line.correlationColor }
                : {};

              const inlineStyle = line.isSpacer
                ? { backgroundColor: 'rgb(254, 226, 226)', minHeight: '1.5rem' }
                : line.type === 'add'
                  ? { backgroundColor: ADDED_LINE_COLOR }
                  : {};

              return (
                <div
                  key={index}
                  className={`flex ${bgColor} ${textColor} transition-colors`}
                  style={inlineStyle}
                >
                  <div
                    className="w-12 text-right px-2 text-xs text-gray-500 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700"
                    style={correlationBarStyle}
                  >
                    {line.newLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-4 py-0.5">
                    {line.isSpacer ? '' : renderLineContent(line, 'new')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
