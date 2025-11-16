import { useState, useMemo } from 'react';
import { X, Clock, User } from 'lucide-react';
import type { BlameResult, BlameLine } from '@/types/git';
import { Spinner } from '@/components/common/Spinner';

interface BlameViewerProps {
  isOpen: boolean;
  onClose: () => void;
  blameData: BlameResult | null;
  isLoading: boolean;
  onCommitClick?: (commitHash: string) => void;
}

export function BlameViewer({
  isOpen,
  onClose,
  blameData,
  isLoading,
  onCommitClick,
}: BlameViewerProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  // Group consecutive lines by the same commit
  const lineGroups = useMemo(() => {
    if (!blameData?.lines) return [];

    const groups: Array<{ commit: string; lines: BlameLine[] }> = [];
    let currentGroup: BlameLine[] = [];
    let currentCommit = '';

    blameData.lines.forEach((line) => {
      if (line.commitHash !== currentCommit) {
        if (currentGroup.length > 0) {
          groups.push({ commit: currentCommit, lines: currentGroup });
        }
        currentCommit = line.commitHash;
        currentGroup = [line];
      } else {
        currentGroup.push(line);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ commit: currentCommit, lines: currentGroup });
    }

    return groups;
  }, [blameData]);

  if (!isOpen) {
    return null;
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-screen h-screen bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              Git Blame: {blameData?.filePath || 'Loading...'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          ) : blameData && blameData.lines.length > 0 ? (
            <div className="font-mono text-xs">
              {lineGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="border-b border-gray-200 dark:border-gray-700">
                  {group.lines.map((line, lineIdx) => {
                    const isFirstInGroup = lineIdx === 0;
                    const isHovered = hoveredLine === line.lineNumber;

                    return (
                      <div
                        key={line.lineNumber}
                        className={`flex hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                          isHovered ? 'bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                        onMouseEnter={() => setHoveredLine(line.lineNumber)}
                        onMouseLeave={() => setHoveredLine(null)}
                      >
                        {/* Blame info column - only show for first line in group */}
                        {isFirstInGroup ? (
                          <div className="flex-shrink-0 w-96 border-r border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50">
                            <div className="space-y-1">
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() => onCommitClick?.(line.commitHash)}
                                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  title="View commit details"
                                >
                                  {line.shortHash}
                                </button>
                                <span
                                  className="flex-1 text-gray-700 dark:text-gray-300 truncate"
                                  title={line.summary}
                                >
                                  {line.summary}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1" title={line.authorEmail}>
                                  <User className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">{line.author}</span>
                                </div>
                                <div
                                  className="flex items-center gap-1"
                                  title={formatDate(line.authorTime)}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(line.authorTime)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-96 border-r border-gray-200 dark:border-gray-700" />
                        )}

                        {/* Line number column */}
                        <div className="flex-shrink-0 w-16 text-right pr-4 pl-2 py-1 text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/30 border-r border-gray-200 dark:border-gray-700 select-none">
                          {line.lineNumber}
                        </div>

                        {/* Code content column */}
                        <div className="flex-1 px-4 py-1 text-gray-900 dark:text-gray-100 whitespace-pre overflow-x-auto">
                          {line.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No blame data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
