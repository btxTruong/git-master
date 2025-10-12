import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { computeInlineDiff, type InlineDiffSegment } from '@/utils/inlineDiff';
import { computeLineDiff, findChangeGroups, type DiffChange } from '@/utils/lineDiff';

const ADDED_LINE_COLOR = 'rgb(175, 244, 192)';
const UPDATE_LINE_COLOR = 'rgb(231, 237, 250)';
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
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const leftProxyRef = useRef<HTMLDivElement>(null);
  const rightProxyRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  const [leftScrollWidth, setLeftScrollWidth] = useState(0);
  const [rightScrollWidth, setRightScrollWidth] = useState(0);
  const [leftClientWidth, setLeftClientWidth] = useState(0);
  const [rightClientWidth, setRightClientWidth] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

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

    let i = 0;
    while (i < enhancedChanges.length) {
      const change = enhancedChanges[i];

      if (change.type === 'context') {
        // Context lines are added to both sides
        oldLines.push(change);
        newLines.push(change);
        i++;
      } else {
        // Start of a change block - collect all consecutive deletes and adds
        const blockStartIndex = oldLines.length;
        changeBlockIndices.push(blockStartIndex);

        const deleteLines: DiffLine[] = [];
        const addLines: DiffLine[] = [];

        // Collect all consecutive delete and add lines
        while (i < enhancedChanges.length && enhancedChanges[i].type !== 'context') {
          if (enhancedChanges[i].type === 'delete') {
            deleteLines.push(enhancedChanges[i]);
          } else if (enhancedChanges[i].type === 'add') {
            addLines.push(enhancedChanges[i]);
          }
          i++;
        }

        // Process paired lines first
        const pairCount = Math.min(deleteLines.length, addLines.length);
        for (let j = 0; j < pairCount; j++) {
          oldLines.push(deleteLines[j]);
          newLines.push(addLines[j]);
        }

        // Add remaining deletes with spacers in new
        for (let j = pairCount; j < deleteLines.length; j++) {
          oldLines.push(deleteLines[j]);
          newLines.push({
            type: 'context',
            oldLineNumber: null,
            newLineNumber: null,
            content: '',
            isSpacer: true,
          });
        }

        // Add remaining adds with spacers in old
        for (let j = pairCount; j < addLines.length; j++) {
          oldLines.push({
            type: 'context',
            oldLineNumber: null,
            newLineNumber: null,
            content: '',
            isSpacer: true,
          });
          newLines.push(addLines[j]);
        }
      }
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

    const updateScrollbarWidth = () => {
      if (scrollContainer) {
        const width = scrollContainer.offsetWidth - scrollContainer.clientWidth;
        setScrollbarWidth(width);
      }
    };

    updateScrollbarWidth();
    scrollContainer.addEventListener('scroll', handleScroll);

    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  // Measure content dimensions for proxy scrollbar sizing
  useEffect(() => {
    const leftContent = leftContentRef.current;
    const rightContent = rightContentRef.current;

    if (!leftContent && !rightContent) return;

    const updateDimensions = () => {
      if (leftContent) {
        setLeftScrollWidth(leftContent.scrollWidth);
        setLeftClientWidth(leftContent.clientWidth);
      }
      if (rightContent) {
        setRightScrollWidth(rightContent.scrollWidth);
        setRightClientWidth(rightContent.clientWidth);
      }
    };

    const timeoutId = setTimeout(() => {
      updateDimensions();
    }, 0);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateDimensions);
    });

    if (leftContent) {
      resizeObserver.observe(leftContent);
    }
    if (rightContent) {
      resizeObserver.observe(rightContent);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [oldLines, newLines]);

  // Left pane horizontal scroll synchronization
  useEffect(() => {
    const leftContent = leftContentRef.current;
    const leftProxy = leftProxyRef.current;

    if (!leftContent || !leftProxy) return;

    const syncContentToProxy = () => {
      if (isSyncingLeft.current) return;
      isSyncingLeft.current = true;
      requestAnimationFrame(() => {
        if (leftProxy) {
          leftProxy.scrollLeft = leftContent.scrollLeft;
        }
        isSyncingLeft.current = false;
      });
    };

    const syncProxyToContent = () => {
      if (isSyncingLeft.current) return;
      isSyncingLeft.current = true;
      requestAnimationFrame(() => {
        if (leftContent) {
          leftContent.scrollLeft = leftProxy.scrollLeft;
        }
        isSyncingLeft.current = false;
      });
    };

    leftContent.addEventListener('scroll', syncContentToProxy, { passive: true });
    leftProxy.addEventListener('scroll', syncProxyToContent, { passive: true });

    return () => {
      leftContent.removeEventListener('scroll', syncContentToProxy);
      leftProxy.removeEventListener('scroll', syncProxyToContent);
    };
  }, [leftScrollWidth]);

  // Right pane horizontal scroll synchronization
  useEffect(() => {
    const rightContent = rightContentRef.current;
    const rightProxy = rightProxyRef.current;

    if (!rightContent || !rightProxy) return;

    const syncContentToProxy = () => {
      if (isSyncingRight.current) return;
      isSyncingRight.current = true;
      requestAnimationFrame(() => {
        if (rightProxy) {
          rightProxy.scrollLeft = rightContent.scrollLeft;
        }
        isSyncingRight.current = false;
      });
    };

    const syncProxyToContent = () => {
      if (isSyncingRight.current) return;
      isSyncingRight.current = true;
      requestAnimationFrame(() => {
        if (rightContent) {
          rightContent.scrollLeft = rightProxy.scrollLeft;
        }
        isSyncingRight.current = false;
      });
    };

    rightContent.addEventListener('scroll', syncContentToProxy, { passive: true });
    rightProxy.addEventListener('scroll', syncProxyToContent, { passive: true });

    return () => {
      rightContent.removeEventListener('scroll', syncContentToProxy);
      rightProxy.removeEventListener('scroll', syncProxyToContent);
    };
  }, [rightScrollWidth]);

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
        <span className="whitespace-pre">
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

    return <span className="whitespace-pre">{line.content}</span>;
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

  // Check if file is completely new (no old content)
  const isNewFile = !oldContent && newContent;

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Navigation buttons */}
      {!isNewFile && (
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
      )}

      {/* Scroll container with split panes */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div
          className={`${isNewFile ? '' : 'grid grid-cols-2'} bg-gray-300 dark:bg-gray-700 min-h-full`}
        >
          {/* Left pane: Old file */}
          {!isNewFile && (
            <div
              ref={leftPaneRef}
              className="overflow-y-hidden bg-white dark:bg-gray-900 font-mono text-sm flex flex-col"
            >
              <div className="sticky top-0 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-300 px-4 py-2 text-xs font-semibold z-10">
                Old: {fileName}
                {!oldContent && newContent ? ' (no previous version)' : ''}
              </div>
              {oldLines.length === 0 && newLines.length > 0 && (
                <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 italic text-center">
                  File did not exist in the parent commit.
                </div>
              )}
              <div className="flex-1 flex overflow-hidden">
                <div
                  ref={leftContentRef}
                  className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden"
                >
                  <div className="w-max min-w-full">
                    {oldLines.map((line, index) => {
                      let bgColor =
                        'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
                      let textColor = 'text-gray-800 dark:text-gray-200';

                      if (line.isSpacer) {
                        bgColor = '';
                        textColor = '';
                      } else if (line.type === 'delete') {
                        bgColor =
                          'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
                        textColor = 'text-red-900 dark:text-red-100';
                      }

                      const inlineStyle = line.isSpacer
                        ? { backgroundColor: ADDED_LINE_COLOR }
                        : {};

                      return (
                        <div
                          key={index}
                          data-line-index={index}
                          className={`px-4 py-0.5 ${bgColor} ${textColor} transition-colors min-h-[1.5rem]`}
                          style={inlineStyle}
                        >
                          {line.isSpacer ? (
                            <span className="whitespace-pre">&nbsp;</span>
                          ) : (
                            renderLineContent(line, 'old')
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="w-12 flex-shrink-0 overflow-hidden">
                  {oldLines.map((line, index) => {
                    let bgColor =
                      'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';

                    if (line.isSpacer) {
                      bgColor = '';
                    } else if (line.type === 'delete') {
                      bgColor =
                        'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
                    }

                    const correlationBarStyle = line.correlationColor
                      ? { borderLeftWidth: '3px', borderLeftColor: line.correlationColor }
                      : {};

                    const inlineStyle = line.isSpacer ? { backgroundColor: ADDED_LINE_COLOR } : {};

                    return (
                      <div
                        key={index}
                        className={`text-left px-2 py-0.5 text-xs ${bgColor} text-gray-500 dark:text-gray-500 select-none border-l border-gray-200 dark:border-gray-700 min-h-[1.5rem]`}
                        style={{ ...inlineStyle, ...correlationBarStyle }}
                      >
                        {line.oldLineNumber ?? ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Right pane: New file */}
          <div
            ref={rightPaneRef}
            className="overflow-y-hidden bg-white dark:bg-gray-900 font-mono text-sm flex flex-col"
          >
            <div className="sticky top-0 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-300 px-4 py-2 text-xs font-semibold border-b border-green-200 dark:border-green-800 z-10">
              {isNewFile ? `New File: ${fileName}` : `New: ${fileName}`}
              {oldContent && !newContent ? ' (deleted)' : ''}
            </div>
            {newLines.length === 0 && oldLines.length > 0 && (
              <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 italic text-center">
                File was deleted in this commit.
              </div>
            )}
            <div className="flex-1 flex overflow-hidden">
              <div className="w-12 flex-shrink-0 overflow-hidden">
                {newLines.map((line, index) => {
                  let bgColor = 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';

                  if (line.isSpacer) {
                    bgColor = '';
                  } else if (line.type === 'add' || isNewFile) {
                    bgColor = '';
                  }

                  const correlationBarStyle = line.correlationColor
                    ? { borderRightWidth: '3px', borderRightColor: line.correlationColor }
                    : {};

                  const inlineStyle = line.isSpacer
                    ? { backgroundColor: 'rgb(254, 226, 226)' }
                    : line.type === 'add' || isNewFile
                      ? { backgroundColor: ADDED_LINE_COLOR }
                      : {};

                  return (
                    <div
                      key={index}
                      className={`text-right px-2 py-0.5 text-xs ${bgColor} text-gray-500 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700 min-h-[1.5rem]`}
                      style={{ ...inlineStyle, ...correlationBarStyle }}
                    >
                      {line.newLineNumber ?? ''}
                    </div>
                  );
                })}
              </div>
              <div
                ref={rightContentRef}
                className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden"
              >
                <div className="w-max min-w-full">
                  {newLines.map((line, index) => {
                    let bgColor =
                      'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
                    let textColor = 'text-gray-800 dark:text-gray-200';

                    if (line.isSpacer) {
                      bgColor = '';
                      textColor = '';
                    } else if (line.type === 'add' || isNewFile) {
                      textColor = 'text-gray-800 dark:text-gray-200';
                    }

                    const inlineStyle = line.isSpacer
                      ? { backgroundColor: 'rgb(254, 226, 226)' }
                      : line.type === 'add' || isNewFile
                        ? { backgroundColor: ADDED_LINE_COLOR }
                        : {};

                    return (
                      <div
                        key={index}
                        className={`px-4 py-0.5 ${bgColor} ${textColor} transition-colors min-h-[1.5rem]`}
                        style={inlineStyle}
                      >
                        {line.isSpacer ? (
                          <span className="whitespace-pre">&nbsp;</span>
                        ) : (
                          renderLineContent(line, 'new')
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky horizontal scrollbars footer */}
      {!isNewFile && (leftScrollWidth > leftClientWidth || rightScrollWidth > rightClientWidth) && (
        <div
          className="grid grid-cols-2 bg-gray-300 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600"
          style={{ paddingRight: `${scrollbarWidth}px` }}
        >
          {/* Left pane footer: scrollbar + line number spacer */}
          <div className="flex overflow-hidden bg-white dark:bg-gray-900 font-mono text-sm">
            <div ref={leftProxyRef} className="flex-1 h-4 overflow-x-auto overflow-y-hidden">
              {leftScrollWidth > leftClientWidth && (
                <div style={{ width: leftScrollWidth, height: '1px' }} />
              )}
            </div>
            <div className="w-12 flex-shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-700">
              <div className="h-4" />
            </div>
          </div>

          {/* Right pane footer: line number spacer + scrollbar */}
          <div className="flex overflow-hidden bg-white dark:bg-gray-900 font-mono text-sm">
            <div className="w-12 flex-shrink-0 overflow-hidden border-r border-gray-200 dark:border-gray-700">
              <div className="h-4" />
            </div>
            <div ref={rightProxyRef} className="flex-1 h-4 overflow-x-auto overflow-y-hidden">
              {rightScrollWidth > rightClientWidth && (
                <div style={{ width: rightScrollWidth, height: '1px' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single proxy scrollbar for new files */}
      {isNewFile && rightScrollWidth > rightClientWidth && (
        <div className="bg-gray-300 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
          <div
            ref={rightProxyRef}
            className="h-4 overflow-x-auto overflow-y-hidden bg-white dark:bg-gray-900"
          >
            <div style={{ width: rightScrollWidth, height: '1px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
