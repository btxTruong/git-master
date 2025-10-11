import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Cherry, X, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useBranchStore } from '@/stores/branchStore';
import { useCherryPickStore } from '@/stores/cherryPickStore';
import { format } from 'date-fns';

interface CherryPickDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CherryPickDialog({ isOpen, onClose }: CherryPickDialogProps) {
  const { branches, currentBranch } = useBranchStore();
  const {
    loadCherryPickCommits,
    toggleCommit,
    startCherryPick,
    clearSelection,
    selectedCommits,
    availableCommits,
    isLoading,
  } = useCherryPickStore();

  const [sourceBranch, setSourceBranch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Filter out the current branch for cherry-pick source
  const sourceBranches = branches.filter(
    (branch) => branch.name !== currentBranch && !branch.remote
  );

  // Load commits when source branch changes
  useEffect(() => {
    if (sourceBranch) {
      loadCherryPickCommits(sourceBranch);
    }
  }, [sourceBranch, loadCherryPickCommits]);

  const handleCherryPick = async () => {
    if (selectedCommits.length === 0) {
      setError('Please select at least one commit to cherry-pick');
      return;
    }

    setError(null);

    try {
      await startCherryPick();

      // Close dialog on successful cherry-pick
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cherry-pick commits';
      setError(message);
    }
  };

  const handleClose = () => {
    setSourceBranch('');
    clearSelection();
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2"
                  >
                    <Cherry className="w-5 h-5" />
                    Cherry-Pick Commits
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
                      Cherry-picking into:{' '}
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
                      value={sourceBranch}
                      onChange={(e) => setSourceBranch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">Select a branch...</option>
                      {sourceBranches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the branch containing commits you want to cherry-pick
                    </p>
                  </div>

                  {/* Commit list */}
                  {sourceBranch && availableCommits.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Commits ({selectedCommits.length} selected)
                      </label>
                      <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                        {availableCommits.map((commit) => {
                          const isSelected = selectedCommits.includes(commit.hash);

                          return (
                            <button
                              key={commit.hash}
                              onClick={() => toggleCommit(commit.hash)}
                              className={`w-full text-left px-3 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                              type="button"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border ${
                                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                  } flex items-center justify-center`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <code className="text-xs font-mono text-gray-500">
                                      {commit.shortHash}
                                    </code>
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(commit.date), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-900 truncate">{commit.message}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {commit.author.name}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Click commits to select/deselect them for cherry-picking
                      </p>
                    </div>
                  )}

                  {/* Empty state for commits */}
                  {sourceBranch && availableCommits.length === 0 && !isLoading && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-700">
                        No commits available from the selected branch
                      </p>
                    </div>
                  )}

                  {/* Loading state */}
                  {isLoading && sourceBranch && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {sourceBranches.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-700">
                        No branches available for cherry-picking. Create a new branch or switch to a
                        different branch first.
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
                    onClick={handleCherryPick}
                    loading={isLoading}
                    disabled={
                      !sourceBranch || selectedCommits.length === 0 || sourceBranches.length === 0
                    }
                    leftIcon={<Cherry className="w-4 h-4" />}
                  >
                    Cherry-Pick {selectedCommits.length > 0 && `(${selectedCommits.length})`}
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
