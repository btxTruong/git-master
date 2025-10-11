import { useState, useEffect } from 'react';
import { useBranchStore } from '@/stores/branchStore';
import { validateBranchName } from '@/utils/validators';

interface CreateBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBranchDialog({ isOpen, onClose }: CreateBranchDialogProps) {
  const { branches, currentBranch, createBranch, isLoading } = useBranchStore();
  const [branchName, setBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [checkout, setCheckout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    // Only update internal state when transitioning from closed to open
    if (isOpen && !isDialogOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchName('');
      setBaseBranch(currentBranch);
      setCheckout(true);
      setError(null);
      setIsDialogOpen(true);
    } else if (!isOpen && isDialogOpen) {
      setIsDialogOpen(false);
    }
  }, [isOpen, isDialogOpen, currentBranch]);

  const handleCreate = async () => {
    // Validate branch name
    const validation = validateBranchName(branchName);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid branch name');
      return;
    }

    // Check if branch already exists
    if (branches.some((b) => b.name === branchName.trim())) {
      setError(`Branch "${branchName.trim()}" already exists`);
      return;
    }

    try {
      await createBranch(branchName.trim(), baseBranch, checkout);
      onClose();
    } catch {
      // Error is already handled by the store (toast notification)
      // Keep dialog open so user can fix the issue
    }
  };

  const handleBranchNameChange = (value: string) => {
    setBranchName(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to create branch
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  if (!isOpen) {
    return null;
  }

  // Get list of branches for base branch selection
  const localBranches = branches.filter((b) => !b.remote);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Create New Branch</h2>

        <div className="mb-4">
          <label htmlFor="branch-name" className="mb-2 block text-sm font-medium text-gray-700">
            Branch Name
          </label>
          <input
            type="text"
            id="branch-name"
            value={branchName}
            onChange={(e) => handleBranchNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="feature/my-feature"
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={isLoading}
            autoFocus
          />

          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

          <p className="mt-2 text-xs text-gray-500">
            Use forward slashes (/) to create branch groups (e.g., feature/name, bugfix/name)
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="base-branch" className="mb-2 block text-sm font-medium text-gray-700">
            Create from
          </label>
          <select
            id="base-branch"
            value={baseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Current branch ({currentBranch})</option>
            {localBranches.map((branch) => (
              <option key={branch.name} value={branch.name}>
                {branch.name}
                {branch.current ? ' (current)' : ''}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-gray-500">
            The new branch will be created from the selected branch
          </p>
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="checkout"
            checked={checkout}
            onChange={(e) => setCheckout(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="checkout" className="ml-2 text-sm text-gray-700">
            Checkout new branch after creation
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
}
