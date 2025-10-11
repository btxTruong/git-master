import { useState, useEffect } from 'react';
import { useStagingStore } from '@/stores/stagingStore';
import { validateCommitMessage } from '@/utils/validators';

interface CommitDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommitDialog({ isOpen, onClose }: CommitDialogProps) {
  const { commitMessage, setCommitMessage, commit, isCommitting, stagedFiles } = useStagingStore();
  const [amend, setAmend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    // Only update internal state when transitioning from closed to open
    if (isOpen && !isDialogOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmend(false);
      setError(null);
      setIsDialogOpen(true);
    } else if (!isOpen && isDialogOpen) {
      setIsDialogOpen(false);
    }
  }, [isOpen, isDialogOpen]);

  const handleCommit = async () => {
    // Validate message
    const validation = validateCommitMessage(commitMessage);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid commit message');
      return;
    }

    try {
      await commit(commitMessage, amend);
      onClose();
    } catch {
      // Error is already handled by the store (toast notification)
      // Keep dialog open so user can fix the issue
    }
  };

  const handleMessageChange = (value: string) => {
    setCommitMessage(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to commit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    }
  };

  if (!isOpen) {
    return null;
  }

  const lines = commitMessage.split('\n');
  const subjectLine = lines[0] || '';
  const subjectLength = subjectLine.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Commit Changes</h2>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="commit-message" className="block text-sm font-medium text-gray-700">
              Commit Message
            </label>
            <span
              className={`text-xs ${
                subjectLength > 72
                  ? 'text-red-600'
                  : subjectLength > 50
                    ? 'text-yellow-600'
                    : 'text-gray-500'
              }`}
            >
              Subject: {subjectLength}/72
            </span>
          </div>

          <textarea
            id="commit-message"
            value={commitMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter commit message...&#10;&#10;Optional: Add detailed description here"
            className={`w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            rows={8}
            disabled={isCommitting}
          />

          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

          <p className="mt-2 text-xs text-gray-500">
            Tip: Keep the subject line under 50 characters. Use Cmd/Ctrl + Enter to commit.
          </p>
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="amend"
            checked={amend}
            onChange={(e) => setAmend(e.target.checked)}
            disabled={isCommitting}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="amend" className="ml-2 text-sm text-gray-700">
            Amend previous commit
          </label>
        </div>

        <div className="mb-4 rounded-md bg-gray-50 p-3">
          <p className="text-sm text-gray-600">
            {stagedFiles.length} file{stagedFiles.length !== 1 ? 's' : ''} staged for commit
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCommitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCommit}
            disabled={isCommitting || !commitMessage.trim() || stagedFiles.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCommitting ? 'Committing...' : amend ? 'Amend Commit' : 'Create Commit'}
          </button>
        </div>
      </div>
    </div>
  );
}
