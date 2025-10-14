import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, X } from 'lucide-react';
import { validateBranchName } from '@/utils/validators';

interface NewBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (branchName: string, checkout: boolean) => Promise<void>;
  commitHash: string;
}

export function NewBranchDialog({ isOpen, onClose, onConfirm, commitHash }: NewBranchDialogProps) {
  const [branchName, setBranchName] = useState('');
  const [checkout, setCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBranchName('');
      setCheckout(false);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    const validation = validateBranchName(branchName);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid branch name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(branchName.trim(), checkout);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create branch';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
            <GitBranch className="w-5 h-5" />
            Create New Branch
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
            Create a new branch at commit <code className="font-mono text-xs">{commitHash}</code>
          </p>

          <label
            htmlFor="branch-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Branch Name
          </label>
          <input
            type="text"
            id="branch-name"
            value={branchName}
            onChange={(e) => {
              setBranchName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="feature/my-feature"
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
            Use forward slashes (/) to create branch groups (e.g., feature/name)
          </p>
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="checkout"
            checked={checkout}
            onChange={(e) => setCheckout(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="checkout" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Checkout new branch after creation
          </label>
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
            disabled={isLoading || !branchName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
