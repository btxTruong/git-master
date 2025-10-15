import { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import { getUnpushedCommits } from '@/api/remote';
import {
  GetCommitDetail,
  GetFileContentAtCommit,
} from '../../../wailsjs/go/services/RepositoryService';
import { models } from '../../../wailsjs/go/models';
import { Spinner } from '@/components/common/Spinner';
import { FileTreePanel } from '@/components/commit/FileTreePanel';
import { DiffModal } from '@/components/commit/DiffModal';

interface PushModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPush: (force: boolean) => Promise<void>;
  branch: string;
}

export function PushModal({ isOpen, onClose, onPush, branch }: PushModalProps) {
  const [commits, setCommits] = useState<models.CommitDetail[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<models.CommitDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<models.FileChange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [forceEnabled, setForceEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [fileContent, setFileContent] = useState<{
    oldContent: string;
    newContent: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCommits();
    } else {
      // Reset state when modal closes
      setCommits([]);
      setSelectedCommit(null);
      setSelectedFile(null);
      setForceEnabled(false);
      setError(null);
      setIsDiffModalOpen(false);
      setFileContent(null);
    }
  }, [isOpen, branch]);

  // Auto-select first commit when commits are loaded
  useEffect(() => {
    if (commits.length > 0 && !selectedCommit) {
      setSelectedCommit(commits[0]);
    }
  }, [commits, selectedCommit]);

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

  const handleFileSelect = async (file: models.FileChange) => {
    if (!selectedCommit) return;

    setSelectedFile(file);
    setIsLoadingDiff(true);
    setFileContent(null);

    try {
      // Get the parent commit hash (if exists)
      const parentHash =
        selectedCommit.parentHashes && selectedCommit.parentHashes.length > 0
          ? selectedCommit.parentHashes[0]
          : '';

      // Fetch old and new content
      const oldContent =
        parentHash && file.oldPath
          ? await GetFileContentAtCommit(parentHash, file.oldPath)
          : '';
      const newContent = file.newPath
        ? await GetFileContentAtCommit(selectedCommit.hash, file.newPath)
        : '';

      setFileContent({ oldContent, newContent });
      setIsDiffModalOpen(true);
    } catch (err) {
      console.error('Failed to load file content:', err);
      setError('Failed to load file diff');
    } finally {
      setIsLoadingDiff(false);
    }
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
      <div className="w-[90vw] h-[85vh] rounded-lg bg-white dark:bg-gray-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Push to Remote
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Branch: {branch} • {commits.length} {commits.length === 1 ? 'commit' : 'commits'} to
              push
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

        {/* Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center w-full py-12">
              <Spinner text="Loading commits..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center w-full py-12 text-center">
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
            <div className="flex flex-col items-center justify-center w-full py-12 text-center">
              <Upload className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No commits to push</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Your branch is up to date with the remote
              </p>
            </div>
          ) : (
            <>
              {/* Left Panel - Commit List */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-2">
                    Commits ({commits.length})
                  </h3>
                  <div className="space-y-1">
                    {commits.map((commit) => {
                      const isSelected = selectedCommit?.hash === commit.hash;

                      return (
                        <button
                          key={commit.hash}
                          onClick={() => setSelectedCommit(commit)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {commit.shortHash}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-2 mb-1">
                            {commit.shortMessage}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{commit.author.name}</span>
                            <span>•</span>
                            <span>
                              {commit.files.length} {commit.files.length === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel - File Tree */}
              <div className="flex-1 overflow-hidden">
                {selectedCommit ? (
                  <FileTreePanel
                    commitDetail={selectedCommit}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    Select a commit to view files
                  </div>
                )}
              </div>
            </>
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

        {/* Diff Modal */}
        <DiffModal
          isOpen={isDiffModalOpen}
          onClose={() => {
            setIsDiffModalOpen(false);
            setSelectedFile(null);
            setFileContent(null);
          }}
          selectedFile={selectedFile}
          isLoading={isLoadingDiff}
          fileContent={fileContent}
          oldCommitHash={
            selectedCommit?.parentHashes && selectedCommit.parentHashes.length > 0
              ? selectedCommit.parentHashes[0]
              : undefined
          }
          newCommitHash={selectedCommit?.hash}
        />
      </div>
    </div>
  );
}
