import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, X } from 'lucide-react';

interface NewTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tagName: string, message: string) => Promise<void>;
  commitHash: string;
}

export function NewTagDialog({ isOpen, onClose, onConfirm, commitHash }: NewTagDialogProps) {
  const [tagName, setTagName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTagName('');
      setMessage('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const validateTagName = (name: string): boolean => {
    if (!name.trim()) {
      setError('Tag name is required');
      return false;
    }

    if (!/^[a-zA-Z0-9._\-/]+$/.test(name)) {
      setError('Tag name contains invalid characters');
      return false;
    }

    if (name.startsWith('.') || name.startsWith('-')) {
      setError('Tag name cannot start with . or -');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateTagName(tagName)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(tagName.trim(), message.trim());
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.id === 'tag-name') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const dialogContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Create New Tag
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Create a new tag at commit <code className="font-mono text-xs">{commitHash}</code>
          </p>

          <label
            htmlFor="tag-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tag Name
          </label>
          <input
            type="text"
            id="tag-name"
            value={tagName}
            onChange={(e) => {
              setTagName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="v1.0.0"
            className={`w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={isLoading}
            autoFocus
          />

          {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Examples: v1.0.0, release/2024-01
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="tag-message"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Message (Optional)
          </label>
          <textarea
            id="tag-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tag description..."
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 resize-none"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty for a lightweight tag, or add a message for an annotated tag
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !tagName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Tag'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
