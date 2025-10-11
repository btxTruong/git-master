import { useState, useEffect } from 'react';
import { useRebaseStore } from '@/stores/rebaseStore';
import { X, GitBranch, Loader2 } from 'lucide-react';
import { RebaseCommitList } from './RebaseCommitList';

interface RebaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetBranch?: string;
}

export function RebaseDialog({ isOpen, onClose, targetBranch }: RebaseDialogProps) {
  const { loadRebaseCommits, startRebase, isLoading, commits } = useRebaseStore();
  const [selectedBranch, setSelectedBranch] = useState(targetBranch || '');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (selectedBranch) {
      loadRebaseCommits(selectedBranch);
    }
  }, [selectedBranch, loadRebaseCommits]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startRebase();
      onClose();
    } finally {
      setIsStarting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Interactive Rebase</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Branch Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Target Branch</label>
          <input
            type="text"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            placeholder="main"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            The branch to rebase onto (e.g., main, develop)
          </p>
        </div>

        {/* Commit List */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : commits.length === 0 ? (
            <div className="text-gray-400 text-center py-12">
              <p>No commits to rebase</p>
              <p className="text-sm mt-2">Enter a target branch to see commits</p>
            </div>
          ) : (
            <RebaseCommitList />
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 rounded p-3 mb-4 text-xs text-gray-400">
          <p className="font-semibold mb-2">Rebase Actions:</p>
          <ul className="space-y-1">
            <li>
              <strong>Pick:</strong> Use commit as-is
            </li>
            <li>
              <strong>Reword:</strong> Use commit, but edit the message
            </li>
            <li>
              <strong>Edit:</strong> Use commit, but stop for amending
            </li>
            <li>
              <strong>Squash:</strong> Combine with previous commit
            </li>
            <li>
              <strong>Fixup:</strong> Like squash, but discard commit message
            </li>
            <li>
              <strong>Drop:</strong> Remove commit
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={isStarting || commits.length === 0 || !selectedBranch}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Starting...' : 'Start Rebase'}
          </button>
          <button
            onClick={onClose}
            disabled={isStarting}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
