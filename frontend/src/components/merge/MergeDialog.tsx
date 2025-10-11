import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { GitMerge, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useBranchStore } from '@/stores/branchStore';
import { useMergeStore } from '@/stores/mergeStore';

interface MergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MergeDialog({ isOpen, onClose }: MergeDialogProps) {
  const { branches, currentBranch } = useBranchStore();
  const { startMerge, isLoading } = useMergeStore();

  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [strategy, setStrategy] = useState<'default' | 'no-ff' | 'ff-only'>('default');
  const [squash, setSquash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out the current branch and remote branches for merge source
  const mergeableBranches = branches.filter(
    (branch) => branch.name !== currentBranch && !branch.remote
  );

  const handleMerge = async () => {
    if (!selectedBranch) {
      setError('Please select a branch to merge');
      return;
    }

    setError(null);

    try {
      const options: {
        noFastForward?: boolean;
        fastForwardOnly?: boolean;
        squash?: boolean;
      } = {};

      if (strategy === 'no-ff') {
        options.noFastForward = true;
      } else if (strategy === 'ff-only') {
        options.fastForwardOnly = true;
      }

      if (squash) {
        options.squash = true;
      }

      await startMerge(selectedBranch, options);

      // Close dialog on successful merge (or when conflicts are detected)
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start merge';
      setError(message);
    }
  };

  const handleClose = () => {
    setSelectedBranch('');
    setStrategy('default');
    setSquash(false);
    setError(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2"
                  >
                    <GitMerge className="w-5 h-5" />
                    Merge Branch
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Current branch info */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-gray-700">
                      Merging into:{' '}
                      <span className="font-semibold text-blue-700">{currentBranch}</span>
                    </p>
                  </div>

                  {/* Source branch selection */}
                  <div>
                    <label
                      htmlFor="source-branch"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Source Branch *
                    </label>
                    <select
                      id="source-branch"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Select a branch...</option>
                      {mergeableBranches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                          {branch.ahead !== undefined &&
                            branch.ahead > 0 &&
                            ` (${branch.ahead} ahead)`}
                          {branch.behind !== undefined &&
                            branch.behind > 0 &&
                            ` (${branch.behind} behind)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Merge strategy */}
                  <div>
                    <label
                      htmlFor="merge-strategy"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Merge Strategy
                    </label>
                    <select
                      id="merge-strategy"
                      value={strategy}
                      onChange={(e) =>
                        setStrategy(e.target.value as 'default' | 'no-ff' | 'ff-only')
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="default">Default (fast-forward if possible)</option>
                      <option value="no-ff">No Fast-Forward (always create merge commit)</option>
                      <option value="ff-only">Fast-Forward Only (fail if not possible)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {strategy === 'default' &&
                        'Git will fast-forward if possible, otherwise create a merge commit'}
                      {strategy === 'no-ff' &&
                        'Always creates a merge commit, preserving branch history'}
                      {strategy === 'ff-only' &&
                        'Only merge if fast-forward is possible, otherwise fail'}
                    </p>
                  </div>

                  {/* Squash option */}
                  <div className="flex items-center">
                    <input
                      id="squash"
                      type="checkbox"
                      checked={squash}
                      onChange={(e) => setSquash(e.target.checked)}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="squash" className="ml-2 text-sm text-gray-700">
                      Squash commits
                    </label>
                  </div>
                  {squash && (
                    <p className="text-xs text-gray-500 ml-6">
                      Combine all commits from the source branch into a single commit
                    </p>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {mergeableBranches.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-700">
                        No branches available to merge. Create a new branch or switch to a different
                        branch first.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-end">
                  <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleMerge}
                    loading={isLoading}
                    disabled={!selectedBranch || mergeableBranches.length === 0}
                    leftIcon={<GitMerge className="w-4 h-4" />}
                  >
                    Merge
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
