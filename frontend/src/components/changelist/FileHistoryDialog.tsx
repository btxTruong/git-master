import { useState, useEffect, useCallback, useRef } from 'react';
import { X, History, GitCommit } from 'lucide-react';
import { GetFileHistory, GetFileCommitDiff } from '../../../wailsjs/go/services/RepositoryService';
import { GetBlameForCommit } from '../../../wailsjs/go/services/BlameService';
import type { Commit } from '@/stores/commitStore';
import type { BlameResult } from '@/types/git';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface FileHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
}

export function FileHistoryDialog({ isOpen, onClose, filePath }: FileHistoryDialogProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [blameData, setBlameData] = useState<BlameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  const pageSize = 50;

  // Load commits for the file
  const loadCommits = useCallback(
    async (pageNum: number) => {
      setIsLoading(true);
      try {
        const offset = pageNum * pageSize;
        const newCommits = await GetFileHistory(filePath, pageSize, offset);

        if (pageNum === 0) {
          setCommits(newCommits);
        } else {
          setCommits((prev) => [...prev, ...newCommits]);
        }

        setHasMore(newCommits.length === pageSize);
        setPage(pageNum);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load file history';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [filePath]
  );

  // Load commit diff and blame
  const loadCommitDiff = useCallback(
    async (commit: Commit) => {
      setIsDiffLoading(true);
      try {
        const [diff, blame] = await Promise.all([
          GetFileCommitDiff(commit.hash, filePath),
          GetBlameForCommit(filePath, commit.hash).catch(() => null), // Blame might fail for deleted files
        ]);
        setDiff(diff || '');
        setBlameData(blame);
        setSelectedCommit(commit);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load commit diff';
        toast.error(message);
      } finally {
        setIsDiffLoading(false);
      }
    },
    [filePath]
  );

  // Load initial commits when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCommits([]);
      setSelectedCommit(null);
      setDiff('');
      setBlameData(null);
      setPage(0);
      setHasMore(true);
      setIsLoading(false); // Reset loading state
      loadCommits(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filePath]); // loadCommits intentionally omitted to prevent infinite loop

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

      if (bottom && hasMore && !isLoading) {
        loadCommits(page + 1);
      }
    },
    [hasMore, isLoading, page, loadCommits]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                File History
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Commit List */}
          <div
            className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"
            onScroll={handleScroll}
          >
            {commits.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={<GitCommit className="w-12 h-12 text-gray-400" />}
                  title="No History"
                  description="This file has no commit history or may be newly created."
                />
              </div>
            )}

            {commits.map((commit) => {
              const isSelected = selectedCommit?.hash === commit.hash;
              const commitDate = new Date(commit.date);
              const timeAgo = formatDistanceToNow(commitDate, { addSuffix: true });

              return (
                <button
                  key={commit.hash}
                  onClick={() => loadCommitDiff(commit)}
                  className={`w-full text-left p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GitCommit className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {commit.shortMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {commit.shortHash}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {commit.author.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                    </div>
                  </div>
                </button>
              );
            })}

            {isLoading && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" text="Loading history..." />
              </div>
            )}
          </div>

          {/* Diff Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isDiffLoading && (
              <div className="flex items-center justify-center h-full">
                <Spinner size="md" text="Loading diff..." />
              </div>
            )}

            {!isDiffLoading && !selectedCommit && (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={<GitCommit className="w-12 h-12 text-gray-400" />}
                  title="No Commit Selected"
                  description="Select a commit from the list to view its changes."
                />
              </div>
            )}

            {!isDiffLoading && selectedCommit && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Commit Info */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedCommit.shortMessage}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      <strong>Commit:</strong> {selectedCommit.hash}
                    </span>
                    <span>
                      <strong>Author:</strong> {selectedCommit.author.name}
                    </span>
                    <span>
                      <strong>Date:</strong> {new Date(selectedCommit.date).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Diff Content with Blame */}
                <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
                  {diff.split('\n').filter((line) => {
                    // Filter out all git metadata lines - only keep actual content
                    if (line.startsWith('diff ')) return false;
                    if (line.startsWith('index ')) return false;
                    if (line.startsWith('--- a/') || line.startsWith('--- /dev/null')) return false;
                    if (line.startsWith('+++ b/') || line.startsWith('+++ /dev/null')) return false;
                    if (line.startsWith('@@')) return false;
                    if (line.startsWith('new file mode')) return false;
                    if (line.startsWith('deleted file mode')) return false;
                    if (line.startsWith('similarity index')) return false;
                    if (line.startsWith('rename from')) return false;
                    if (line.startsWith('rename to')) return false;
                    if (line.startsWith('copy from')) return false;
                    if (line.startsWith('copy to')) return false;
                    if (line.startsWith('old mode')) return false;
                    if (line.startsWith('new mode')) return false;
                    if (line.startsWith('dissimilarity index')) return false;
                    if (line.startsWith('Binary files')) return false;
                    if (line.startsWith('GIT binary patch')) return false;
                    if (line.startsWith('\\')) return false; // "\ No newline at end of file"
                    return true;
                  }).map((line, index) => {
                    let textColor = '';
                    let bgColor = '';
                    let displayLine = line;
                    let isAddition = false;
                    let isDeletion = false;

                    // Determine line type and strip prefix for display
                    if (line.startsWith('+')) {
                      isAddition = true;
                      textColor = 'text-green-700 dark:text-green-300';
                      bgColor = 'bg-green-50 dark:bg-green-900/20';
                      displayLine = line.substring(1); // Remove + prefix
                    } else if (line.startsWith('-')) {
                      isDeletion = true;
                      textColor = 'text-red-700 dark:text-red-300';
                      bgColor = 'bg-red-50 dark:bg-red-900/20';
                      displayLine = line.substring(1); // Remove - prefix
                    } else {
                      textColor = 'text-gray-700 dark:text-gray-300';
                      displayLine = line.startsWith(' ') ? line.substring(1) : line; // Remove space prefix if present
                    }

                    // Show blame info for all lines (not just added ones)
                    // Blame shows who originally wrote each line
                    let blameInfo = null;
                    if (blameData) {
                      if (isAddition) {
                        // For added lines, use the line without + prefix
                        const blameLine = blameData.lines.find(b => b.content === displayLine);
                        if (blameLine) {
                          blameInfo = blameLine;
                        }
                      } else if (!isDeletion) {
                        // For context lines, match directly
                        const blameLine = blameData.lines.find(b => b.content === displayLine);
                        if (blameLine) {
                          blameInfo = blameLine;
                        }
                      }
                    }

                    return (
                      <div key={index} className={`${bgColor} flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/70 group`}>
                        {/* Blame column - always show to maintain alignment */}
                        <div className="flex-shrink-0 w-72 px-3 py-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          {blameInfo ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  {blameInfo.shortHash}
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                  {blameInfo.author}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {blameInfo.summary}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full" />
                          )}
                        </div>
                        {/* Code content - display without +/- prefix */}
                        <div className={`${textColor} px-4 py-2 whitespace-pre flex-1 font-mono text-sm leading-relaxed`}>
                          {displayLine || ' '}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {commits.length} commit{commits.length !== 1 ? 's' : ''} found
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
