import { useState, useEffect } from 'react';
import { Copy, Calendar, GitCommit, ArrowLeft, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { fetchCommitDiff } from '@/api/commit';
import { useUIStore } from '@/stores/uiStore';
import type { Commit, DiffResult } from '@/types/git';

interface CommitDetailProps {
  commit: Commit;
  onParentClick?: (hash: string) => void;
  onBack?: () => void;
}

export function CommitDetail({ commit, onParentClick, onBack }: CommitDetailProps) {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { diffViewMode, setDiffViewMode } = useUIStore();

  useEffect(() => {
    async function loadDiff() {
      setIsLoadingDiff(true);
      setError(null);
      try {
        const diffData = await fetchCommitDiff(commit.hash);
        setDiff(diffData);
      } catch (error) {
        console.error('Failed to load commit diff:', error);
        setError('Failed to load diff. Please try again.');
      } finally {
        setIsLoadingDiff(false);
      }
    }

    loadDiff();
  }, [commit.hash]);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(commit.hash);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy hash:', error);
    }
  };

  const retryFetch = () => {
    loadDiff();
  };

  async function loadDiff() {
    setIsLoadingDiff(true);
    setError(null);
    try {
      const diffData = await fetchCommitDiff(commit.hash);
      setDiff(diffData);
    } catch (error) {
      console.error('Failed to load commit diff:', error);
      setError('Failed to load diff. Please try again.');
    } finally {
      setIsLoadingDiff(false);
    }
  }

  return (
    <div className="commit-detail h-full flex flex-col bg-white">
      <div className="flex-shrink-0 border-b border-gray-200 p-6">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to commits
          </button>
        )}

        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-gray-500" />
          <span className="font-mono text-sm text-gray-600">{commit.hash}</span>
          <button
            onClick={copyHash}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Copy hash"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
          {copySuccess && <span className="text-xs text-green-600">Copied!</span>}
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {commit.author.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{commit.author.name}</div>
            <div className="text-sm text-gray-600">{commit.author.email}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
            {commit.message}
          </pre>
        </div>

        {commit.parents && commit.parents.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              {commit.parents.length > 1 ? 'Merge commit - Parents:' : 'Parent:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {commit.parents.map((parentHash) => (
                <button
                  key={parentHash}
                  className="font-mono text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  onClick={() => onParentClick?.(parentHash)}
                  title={`View parent commit ${parentHash}`}
                >
                  {parentHash.slice(0, 7)}
                </button>
              ))}
            </div>
          </div>
        )}

        {diff && !isLoadingDiff && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-gray-700">
              {diff.files.length} file{diff.files.length !== 1 ? 's' : ''} changed
            </span>
            {(() => {
              const totalAdditions = diff.files.reduce((sum, f) => sum + f.additions, 0);
              const totalDeletions = diff.files.reduce((sum, f) => sum + f.deletions, 0);
              return (
                <>
                  {totalAdditions > 0 && (
                    <span className="text-green-600 font-semibold">+{totalAdditions}</span>
                  )}
                  {totalDeletions > 0 && (
                    <span className="text-red-600 font-semibold">-{totalDeletions}</span>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {isLoadingDiff && <div className="mt-4 text-sm text-gray-500">Loading diff...</div>}
      </div>

      {/* View Mode Toggle */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {error && (
          <div className="flex items-center justify-center gap-3 p-6 bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
            <button
              onClick={retryFetch}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!error && diff && diff.files.length > 0 && (
          <>
            {/* View mode toggle */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setDiffViewMode('unified')}
                className={`px-3 py-1 text-sm rounded ${
                  diffViewMode === 'unified'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unified
              </button>
              <button
                onClick={() => setDiffViewMode('split')}
                className={`px-3 py-1 text-sm rounded ${
                  diffViewMode === 'split'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Split
              </button>
            </div>

            {/* File navigation and diff viewer */}
            <div className="flex-1 flex overflow-hidden">
              {/* File sidebar */}
              <div className="w-64 border-r border-gray-200 overflow-auto bg-gray-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Changed Files ({diff.files.length})
                  </div>
                  {diff.files.map((file, index) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFileIndex(index)}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                        selectedFileIndex === index
                          ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="font-mono truncate text-xs">{file.path}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="text-green-600">+{file.additions || 0}</span>{' '}
                        <span className="text-red-600">-{file.deletions || 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diff viewer */}
              <div className="flex-1 overflow-auto">
                {!isLoadingDiff && <DiffViewer diff={diff} />}
              </div>
            </div>
          </>
        )}

        {!error && !isLoadingDiff && diff && diff.files.length === 0 && (
          <div className="flex items-center justify-center p-6 text-gray-500">
            No changes in this commit
          </div>
        )}
      </div>
    </div>
  );
}
