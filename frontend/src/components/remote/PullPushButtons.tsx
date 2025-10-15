import { useState, useEffect } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { useRemoteStore } from '@/stores/remoteStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { getUnpushedCommitsCount } from '@/api/remote';
import { PushModal } from './PushModal';

/**
 * Pull and Push buttons for the application header
 * Displays loading state during operations and shows unpushed commit count
 */
export function PullPushButtons() {
  const { currentRepository } = useRepositoryStore();
  const { isPulling, isPushing, pull, push } = useRemoteStore();
  const [unpushedCount, setUnpushedCount] = useState(0);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // Load unpushed commits count
  useEffect(() => {
    if (!currentRepository) {
      return;
    }

    const loadUnpushedCount = async () => {
      try {
        const count = await getUnpushedCommitsCount(currentRepository.currentBranch);
        setUnpushedCount(count);
      } catch (error) {
        console.error('Failed to get unpushed commits count:', error);
        setUnpushedCount(0);
      }
    };

    loadUnpushedCount();

    // Refresh count every 10 seconds
    const interval = setInterval(loadUnpushedCount, 10000);

    // Listen for commit completed event to immediately update counter
    const handleCommitCompleted = () => {
      loadUnpushedCount();
    };
    window.addEventListener('commitCompleted', handleCommitCompleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener('commitCompleted', handleCommitCompleted);
    };
  }, [currentRepository?.currentBranch]);

  const handlePull = async () => {
    if (!currentRepository) return;

    try {
      await pull();
      // Refresh unpushed count after pull
      const count = await getUnpushedCommitsCount(currentRepository.currentBranch);
      setUnpushedCount(count);
    } catch (error) {
      // Error is already handled in the store and displayed via toast
    }
  };

  const handlePushClick = () => {
    // Only open modal if there are commits to push
    if (unpushedCount > 0) {
      setIsPushModalOpen(true);
    }
  };

  const handlePush = async (force: boolean) => {
    if (!currentRepository) return;

    try {
      await push({ force });
      // Push includes fetch, so Git refs are updated
      // Reload the actual count to reflect the push
      const count = await getUnpushedCommitsCount(currentRepository.currentBranch);
      setUnpushedCount(count);
    } catch (error) {
      // Error is already handled in the store and displayed via toast
      throw error;
    }
  };

  // Don't show buttons if no repository is open
  if (!currentRepository) {
    return null;
  }

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

      {/* Push button with badge */}
      <button
        onClick={handlePushClick}
        disabled={isPulling || isPushing}
        className={`
          relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded
          transition-colors
          ${
            isPulling || isPushing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        title={`Push commits to remote${unpushedCount > 0 ? ` (${unpushedCount} unpushed)` : ''}`}
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
            {unpushedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-blue-600 rounded-full">
                {unpushedCount > 99 ? '99+' : unpushedCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Push Modal */}
      <PushModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        onPush={handlePush}
        branch={currentRepository.currentBranch}
      />
    </div>
  );
}
