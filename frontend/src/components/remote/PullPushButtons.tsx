import { Download, Upload, Loader2 } from 'lucide-react';
import { useRemoteStore } from '@/stores/remoteStore';
import { useRepositoryStore } from '@/stores/repositoryStore';

/**
 * Pull and Push buttons for the application header
 * Displays loading state during operations
 */
export function PullPushButtons() {
  const { currentRepository } = useRepositoryStore();
  const { isPulling, isPushing, pull, push } = useRemoteStore();

  // Don't show buttons if no repository is open
  if (!currentRepository) {
    return null;
  }

  const handlePull = async () => {
    try {
      await pull();
    } catch (error) {
      // Error is already handled in the store and displayed via toast
      console.error('Pull failed:', error);
    }
  };

  const handlePush = async () => {
    try {
      await push();
    } catch (error) {
      // Error is already handled in the store and displayed via toast
      console.error('Push failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Pull button */}
      <button
        onClick={handlePull}
        disabled={isPulling || isPushing}
        className={`
          flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded
          transition-colors
          ${
            isPulling || isPushing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        title="Pull changes from remote"
      >
        {isPulling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Pulling...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Pull
          </>
        )}
      </button>

      {/* Push button */}
      <button
        onClick={handlePush}
        disabled={isPulling || isPushing}
        className={`
          flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded
          transition-colors
          ${
            isPulling || isPushing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        title="Push commits to remote"
      >
        {isPushing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Pushing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Push
          </>
        )}
      </button>
    </div>
  );
}
