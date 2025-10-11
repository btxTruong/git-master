import { useEffect, useState } from 'react';
import { GitMerge, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { MergeDialog } from '@/components/merge/MergeDialog';
import { useMergeStore } from '@/stores/mergeStore';
import { useBranchStore } from '@/stores/branchStore';
import { useRepositoryStore } from '@/stores/repositoryStore';

export function MergeView() {
  const { currentRepository } = useRepositoryStore();
  const { currentBranch } = useBranchStore();
  const {
    isMerging,
    sourceBranch,
    conflicts,
    isLoading,
    checkMergeStatus,
    abortMerge,
    completeMerge,
  } = useMergeStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Check merge status on mount
  useEffect(() => {
    if (currentRepository) {
      checkMergeStatus();
    }
  }, [currentRepository, checkMergeStatus]);

  const handleAbortMerge = async () => {
    setIsAborting(true);
    try {
      await abortMerge();
    } finally {
      setIsAborting(false);
    }
  };

  const handleCompleteMerge = async () => {
    setIsCompleting(true);
    try {
      await completeMerge();
    } finally {
      setIsCompleting(false);
    }
  };

  // Show empty state if no repository is open
  if (!currentRepository) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<GitMerge className="w-12 h-12" />}
          title="No Repository Open"
          description="Open a repository to start merging branches"
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Checking merge status...</p>
        </div>
      </div>
    );
  }

  // Active merge state
  if (isMerging) {
    const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
    const resolvedConflicts = conflicts.filter((c) => c.resolved);
    const allResolved = unresolvedConflicts.length === 0 && conflicts.length > 0;

    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GitMerge className="w-6 h-6" />
              Merge In Progress
            </h1>
            <p className="text-gray-600 mt-2">
              Merging <span className="font-semibold">{sourceBranch}</span> into{' '}
              <span className="font-semibold">{currentBranch}</span>
            </p>
          </div>

          {/* Conflicts Summary */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conflicts Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Conflicts */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-gray-200 rounded-full p-2">
                  <AlertTriangle className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{conflicts.length}</p>
                  <p className="text-sm text-gray-600">Total Conflicts</p>
                </div>
              </div>

              {/* Resolved */}
              <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-green-200 rounded-full p-2">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">{resolvedConflicts.length}</p>
                  <p className="text-sm text-green-700">Resolved</p>
                </div>
              </div>

              {/* Unresolved */}
              <div className="bg-red-50 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-red-200 rounded-full p-2">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-900">{unresolvedConflicts.length}</p>
                  <p className="text-sm text-red-700">Unresolved</p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {allResolved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    All conflicts have been resolved! You can now complete the merge.
                  </p>
                </div>
              </div>
            )}

            {/* Conflicted Files List */}
            {conflicts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Conflicted Files</h3>
                <div className="space-y-2">
                  {conflicts.map((conflict) => (
                    <div
                      key={conflict.path}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        conflict.resolved
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {conflict.resolved ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span
                          className={`font-mono text-sm ${
                            conflict.resolved ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {conflict.path}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          conflict.resolved
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {conflict.resolved ? 'Resolved' : 'Unresolved'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="danger"
              onClick={handleAbortMerge}
              loading={isAborting}
              disabled={isCompleting}
            >
              Abort Merge
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteMerge}
              loading={isCompleting}
              disabled={!allResolved || isAborting}
              leftIcon={<GitMerge className="w-4 h-4" />}
            >
              Complete Merge
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Resolve all conflicts in the conflicted files</li>
              <li>Mark each file as resolved after fixing conflicts</li>
              <li>Click &ldquo;Complete Merge&rdquo; to finish the merge operation</li>
              <li>
                Or click &ldquo;Abort Merge&rdquo; to cancel the merge and return to the previous
                state
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // No active merge - show start merge interface
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitMerge className="w-6 h-6" />
            Merge Branches
          </h1>
          <p className="text-gray-600 mt-2">
            Merge changes from another branch into{' '}
            <span className="font-semibold">{currentBranch}</span>
          </p>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<GitMerge className="w-12 h-12" />}
          title="No Active Merge"
          description="Start a merge by selecting a source branch to merge into the current branch"
          action={{
            label: 'Start Merge',
            onClick: () => setIsDialogOpen(true),
          }}
        />

        {/* Information Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Merge Strategies</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Fast-Forward</p>
                <p>Applies commits directly if possible, keeps linear history</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">No Fast-Forward</p>
                <p>Always creates a merge commit, preserves branch structure</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Fast-Forward Only</p>
                <p>Only merges if fast-forward is possible, fails otherwise</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Conflict Resolution</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>If conflicts occur during merge:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Conflicted files will be highlighted</li>
                <li>Resolve conflicts manually or use quick actions</li>
                <li>Mark files as resolved after fixing</li>
                <li>Complete merge when all conflicts are resolved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Merge Dialog */}
      <MergeDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
