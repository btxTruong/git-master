import { FolderOpen, GitBranch } from 'lucide-react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { OpenDirectoryDialog } from '../../../wailsjs/go/main/App';

export function AppHeader() {
  const { currentRepository, setRepository } = useRepositoryStore();

  const handleOpenRepo = async () => {
    try {
      const repo = await OpenDirectoryDialog();
      if (repo) {
        setRepository(repo);
      }
    } catch (error) {
      console.error('Failed to open repository:', error);
    }
  };

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      {/* Left: Repository info */}
      <div className="flex items-center gap-4">
        {currentRepository ? (
          <>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">{currentRepository.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GitBranch className="w-4 h-4" />
              <span>
                {currentRepository.isDetached
                  ? `HEAD detached at ${currentRepository.currentBranch.slice(0, 7)}`
                  : currentRepository.currentBranch}
              </span>
            </div>
          </>
        ) : (
          <span className="text-gray-500">No repository open</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenRepo}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
        >
          Open Repository
        </button>
      </div>
    </header>
  );
}
