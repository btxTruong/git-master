import { useState, useEffect } from 'react';
import { Copy, Calendar, GitCommit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DiffViewer } from '@/components/diff/DiffViewer';
import type { Commit, DiffResult } from '@/types/git';

interface CommitDetailProps {
  commit: Commit;
  onParentClick?: (hash: string) => void;
}

export function CommitDetail({ commit, onParentClick }: CommitDetailProps) {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadDiff() {
      setIsLoadingDiff(true);
      try {
        setDiff({
          files: [],
          totalAdditions: 0,
          totalDeletions: 0,
        });
      } catch (error) {
        console.error('Failed to load commit diff:', error);
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

  return (
    <div className="commit-detail h-full flex flex-col bg-white">
      <div className="flex-shrink-0 border-b border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-gray-500" />
          <span className="font-mono text-sm text-gray-600">
            {commit.hash}
          </span>
          <button
            onClick={copyHash}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Copy hash"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
          {copySuccess && (
            <span className="text-xs text-green-600">Copied!</span>
          )}
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {commit.author.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {commit.author.name}
            </div>
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
            {diff.totalAdditions > 0 && (
              <span className="text-green-600 font-semibold">
                +{diff.totalAdditions}
              </span>
            )}
            {diff.totalDeletions > 0 && (
              <span className="text-red-600 font-semibold">
                -{diff.totalDeletions}
              </span>
            )}
          </div>
        )}

        {isLoadingDiff && (
          <div className="mt-4 text-sm text-gray-500">
            Loading diff...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {!isLoadingDiff && diff && <DiffViewer diff={diff} />}
      </div>
    </div>
  );
}
