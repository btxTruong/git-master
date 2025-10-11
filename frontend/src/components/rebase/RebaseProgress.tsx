import { useRebaseStore } from '@/stores/rebaseStore';
import { GitBranch, AlertCircle, Play, SkipForward, X } from 'lucide-react';

export function RebaseProgress() {
  const { isRebasing, currentCommit, continueRebase, skipRebase, abortRebase } = useRebaseStore();

  if (!isRebasing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-start gap-3">
        <GitBranch className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">Rebase in Progress</h3>
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          </div>

          {currentCommit && (
            <p className="text-sm text-gray-400 mb-3">Current commit: {currentCommit}</p>
          )}

          <p className="text-xs text-gray-500 mb-4">
            Resolve any conflicts, stage your changes, and continue the rebase.
          </p>

          <div className="flex gap-2">
            <button
              onClick={continueRebase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Continue
            </button>
            <button
              onClick={skipRebase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
            <button
              onClick={abortRebase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Abort
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
