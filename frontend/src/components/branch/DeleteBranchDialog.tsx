import { useState, useEffect } from 'react';
import { useBranchStore } from '@/stores/branchStore';

interface DeleteBranchDialogProps {
  isOpen: boolean;
  branchName: string | null;
  onClose: () => void;
}

export function DeleteBranchDialog({ isOpen, branchName, onClose }: DeleteBranchDialogProps) {
  const { deleteBranch, currentBranch, isLoading } = useBranchStore();
  const [force, setForce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    // Only update internal state when transitioning from closed to open
    if (isOpen && !isDialogOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForce(false);
      setError(null);
      setIsDialogOpen(true);
    } else if (!isOpen && isDialogOpen) {
      setIsDialogOpen(false);
    }
  }, [isOpen, isDialogOpen]);

  const handleDelete = async () => {
    if (!branchName) {
      setError('No branch selected');
      return;
    }

    // Prevent deleting current branch
    if (branchName === currentBranch) {
      setError('Cannot delete the current branch. Checkout another branch first.');
      return;
    }

    try {
      await deleteBranch(branchName, force);
      onClose();
    } catch {
      // Error is already handled by the store (toast notification)
      // Keep dialog open so user can fix the issue
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to confirm deletion
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDelete();
    }
  };

  if (!isOpen || !branchName) {
    return null;
  }

  const isCurrentBranch = branchName === currentBranch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Delete Branch</h2>

        <div className="mb-6">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the branch{' '}
            <span className="font-mono font-semibold text-gray-900">{branchName}</span>?
          </p>

          {isCurrentBranch ? (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">
                This is the current branch. You must checkout another branch before deleting it.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-md bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                This action cannot be undone. Make sure the branch is fully merged or you have a
                backup.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="force"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            disabled={isLoading || isCurrentBranch}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
            onKeyDown={handleKeyDown}
          />
          <label htmlFor="force" className="ml-2 text-sm text-gray-700">
            Force delete (even if not fully merged)
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || isCurrentBranch}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete Branch'}
          </button>
        </div>
      </div>
    </div>
  );
}
