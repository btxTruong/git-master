import { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { getUnpushedCommits } from '@/api/remote';
import { GetCommitDetail } from '../../../wailsjs/go/services/RepositoryService';
import { models } from '../../../wailsjs/go/models';
import { Spinner } from '@/components/common/Spinner';

interface PushModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPush: (force: boolean) => Promise<void>;
  branch: string;
}

export function PushModal({ isOpen, onClose, onPush, branch }: PushModalProps) {
  const [commits, setCommits] = useState<models.CommitDetail[]>([]);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [forceEnabled, setForceEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCommits();
    } else {
      // Reset state when modal closes
      setCommits([]);
      setExpandedCommits(new Set());
      setForceEnabled(false);
      setError(null);
    }
  }, [isOpen, branch]);

  const loadCommits = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get list of unpushed commit hashes
      const hashes = await getUnpushedCommits(branch);

      if (hashes.length === 0) {
        setCommits([]);
        setIsLoading(false);
        return;
      }

      // Fetch detailed information for each commit
      const commitDetails = await Promise.all(
        hashes.map(async (hash) => {
          try {
            return await GetCommitDetail(hash);
          } catch (err) {
            console.error(`Failed to fetch commit ${hash}:`, err);
            return null;
          }
        })
      );

      // Filter out null values and set commits
      setCommits(commitDetails.filter((c): c is models.CommitDetail => c !== null));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load commits';
      setError(message);
      console.error('Failed to load unpushed commits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommit = (hash: string) => {
    setExpandedCommits((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  };

  const handlePush = async () => {
    setIsPushing(true);
    setError(null);

    try {
      await onPush(forceEnabled);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to push';
      setError(message);
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-3xl max-h-[80vh] rounded-lg bg-white dark:bg-gray-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Push to Remote
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Branch: {branch}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPushing}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner text="Loading commits..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
                <span className="text-red-600 dark:text-red-400 text-2xl">!</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadCommits}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Upload className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No commits to push</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Your branch is up to date with the remote
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {commits.length} {commits.length === 1 ? 'commit' : 'commits'} will be pushed
              </div>

              {commits.map((commit) => {
                const isExpanded = expandedCommits.has(commit.hash);

                return (
                  <div
                    key={commit.hash}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Commit Header */}
                    <div
                      className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                      onClick={() => toggleCommit(commit.hash)}
                    >
                      <button className="mt-0.5 text-gray-500 dark:text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {commit.shortHash}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            by {commit.author.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {commit.shortMessage}
                        </p>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {commit.files.length} {commit.files.length === 1 ? 'file' : 'files'}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                        {/* Full commit message */}
                        {commit.message && commit.message !== commit.shortMessage && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                              Commit Message
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {commit.message}
                            </p>
                          </div>
                        )}

                        {/* Files changed */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                            Files Changed
                          </h4>
                          <div className="space-y-1">
                            {commit.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm font-mono"
                              >
                                <span
                                  className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                                    file.status === 'A'
                                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                      : file.status === 'M'
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : file.status === 'D'
                                          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                                          : file.status === 'R'
                                            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                                            : file.status === 'C'
                                              ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                                              : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
                                  }`}
                                >
                                  {file.status}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {file.newPath || file.oldPath}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && commits.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            {/* Force push warning */}
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceEnabled}
                  onChange={(e) => setForceEnabled(e.target.checked)}
                  disabled={isPushing}
                  className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-2 focus:ring-red-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Force push
                    </span>
                    {forceEnabled && (
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {forceEnabled
                      ? 'Warning: This will overwrite the remote branch. Use with caution!'
                      : 'Enable force push to overwrite the remote branch (dangerous)'}
                  </p>
                </div>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={isPushing}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePush}
                disabled={isPushing}
                className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  forceEnabled
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isPushing ? (
                  <>
                    <Spinner size="sm" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {forceEnabled ? 'Force Push' : 'Push'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
