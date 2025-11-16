import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Loader2, ChevronDown, Clock } from 'lucide-react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { PullPushButtons } from '@/components/remote/PullPushButtons';
import { BranchDropdown } from '@/components/branch/BranchDropdown';
import { OpenDirectoryDialog } from '../../../wailsjs/go/main/App';
import { OpenRepository } from '../../../wailsjs/go/services/RepositoryService';
import {
  GetRecentRepositories,
  UpdateRepositoryAccess,
} from '../../../wailsjs/go/services/AppConfigService';
import { services } from '../../../wailsjs/go/models';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import toast from 'react-hot-toast';

export function AppHeader() {
  const [isOpening, setIsOpening] = useState(false);
  const [recentRepos, setRecentRepos] = useState<services.RepositoryConfig[]>([]);
  const { currentRepository, setRepository, setLoading, setError } = useRepositoryStore();

  const loadRecentRepos = useCallback(async () => {
    try {
      const repos = await GetRecentRepositories();
      setRecentRepos(repos || []);
    } catch (error) {
      console.error('Failed to load recent repos:', error);
    }
  }, []);

  const updateRepositoryAccess = useCallback(
    async (path: string, name: string) => {
      try {
        await UpdateRepositoryAccess(path, name);
        await loadRecentRepos();
      } catch (error) {
        console.error('Failed to update repository access:', error);
      }
    },
    [loadRecentRepos]
  );

  useEffect(() => {
    loadRecentRepos();
  }, [loadRecentRepos]);

  useEffect(() => {
    if (currentRepository) {
      updateRepositoryAccess(currentRepository.path, currentRepository.name);
    }
  }, [currentRepository, updateRepositoryAccess]);

  const handleOpenRepository = async (path?: string) => {
    try {
      setIsOpening(true);
      setLoading(true);

      let repo;

      if (path) {
        // Open repository directly from path (recent repo clicked)
        repo = await OpenRepository(path);
      } else {
        // Show directory dialog for new repository
        repo = await OpenDirectoryDialog();
      }

      if (!repo) {
        setIsOpening(false);
        setLoading(false);
        return;
      }

      setRepository(repo);
      toast.success(`Opened repository: ${repo.name}`);
    } catch (error) {
      console.error('Failed to open repository:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to open repository: ${errorMessage}`);
      toast.error(`Failed to open repository: ${errorMessage}`);
    } finally {
      setIsOpening(false);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 flex items-center justify-between">
      {/* Left: Repository opener and info */}
      <div className="flex items-center gap-3">
        {currentRepository ? (
          <>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                  <FolderOpen className="w-4 h-4" />
                  <span>{currentRepository.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[300px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer outline-none"
                    onSelect={() => handleOpenRepository()}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Open New Repository
                  </DropdownMenu.Item>

                  {recentRepos.length > 0 && (
                    <>
                      <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Recent Repositories
                      </div>
                      {recentRepos.map((repo) => (
                        <DropdownMenu.Item
                          key={repo.path}
                          className="flex flex-col px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
                          onSelect={() => handleOpenRepository(repo.path)}
                        >
                          <div className="font-medium">{repo.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {formatDate(repo.lastOpened)}
                          </div>
                        </DropdownMenu.Item>
                      ))}
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <BranchDropdown />
          </>
        ) : (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                disabled={isOpening}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[300px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer outline-none"
                  onSelect={() => handleOpenRepository()}
                >
                  <FolderOpen className="w-4 h-4" />
                  Open New Repository
                </DropdownMenu.Item>

                {recentRepos.length > 0 && (
                  <>
                    <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Recent Repositories
                    </div>
                    {recentRepos.map((repo) => (
                      <DropdownMenu.Item
                        key={repo.path}
                        className="flex flex-col px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
                        onSelect={() => handleOpenRepository(repo.path)}
                      >
                        <div className="font-medium">{repo.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {formatDate(repo.lastOpened)}
                        </div>
                      </DropdownMenu.Item>
                    ))}
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Right: Pull/Push buttons */}
      <div className="flex items-center gap-2">
        <PullPushButtons />
      </div>
    </header>
  );
}
