import { useState } from 'react';
import { FolderOpen, GitBranch, Loader2 } from 'lucide-react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { PullPushButtons } from '@/components/remote/PullPushButtons';
import { OpenDirectoryDialog } from '../../../wailsjs/go/main/App';
import toast from 'react-hot-toast';

export function AppHeader() {
  const [isOpening, setIsOpening] = useState(false);
  const { currentRepository, setRepository, setLoading, setError } = useRepositoryStore();

  const handleOpenRepository = async () => {
    try {
      setIsOpening(true);
      setLoading(true);

      // Directly open the file selector - no intermediate dialog
      const repo = await OpenDirectoryDialog();

      // User cancelled
      if (!repo) {
        setIsOpening(false);
        setLoading(false);
        return;
      }

      // Store the repository info
      setRepository(repo);
      toast.success(`Opened repository: ${repo.name}`);
    } catch (error) {
      console.error('Failed to open repository:', error);
      setError(`Failed to open repository: ${error}`);
      toast.error(`Failed to open repository: ${error}`);
    } finally {
      setIsOpening(false);
      setLoading(false);
    }
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 flex items-center justify-between">
      {/* Left: Repository info */}
      <div className="flex items-center gap-4">
        {currentRepository ? (
          <>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">{currentRepository.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <GitBranch className="w-4 h-4" />
              <span>
                {currentRepository.isDetached
                  ? `HEAD detached at ${currentRepository.currentBranch.slice(0, 7)}`
                  : currentRepository.currentBranch}
              </span>
            </div>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">No repository open</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Pull/Push buttons - only shown when repository is open */}
        <PullPushButtons />

        <button
          onClick={handleOpenRepository}
          disabled={isOpening}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOpening ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <FolderOpen className="w-4 h-4" />
              Open Repository
            </>
          )}
        </button>
      </div>
    </header>
  );
}
