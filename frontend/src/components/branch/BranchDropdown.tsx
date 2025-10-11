import { useState, useEffect } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { GetBranches, CheckoutBranch } from '../../../wailsjs/go/services/RepositoryService';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { GitBranch, Plus, Check, Globe, Tag, GitCommit, ChevronDown } from 'lucide-react';
import { CreateBranchDialog } from './CreateBranchDialog';
import toast from 'react-hot-toast';

interface Branch {
  name: string;
  isHead: boolean;
  isRemote: boolean;
  remote: string;
  commitHash: string;
  upstream: string;
}

interface BranchList {
  current: string;
  local: Branch[];
  remote: Branch[];
}

export function BranchDropdown() {
  const { currentRepository } = useRepositoryStore();
  const [branches, setBranches] = useState<BranchList | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (currentRepository) {
      loadBranches();
    }
  }, [currentRepository]);

  const loadBranches = async () => {
    if (!currentRepository) return;

    try {
      setIsLoading(true);
      const result = await GetBranches();
      setBranches(result);
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast.error(`Failed to load branches: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (branchName: string) => {
    if (isCheckingOut) return;

    try {
      setIsCheckingOut(true);
      await CheckoutBranch(branchName);
      toast.success(`Switched to branch: ${branchName}`);
      await loadBranches();
    } catch (error) {
      console.error('Failed to checkout branch:', error);
      toast.error(`Failed to checkout branch: ${error}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!currentRepository) {
    return null;
  }

  const currentBranch = branches?.current || currentRepository.currentBranch;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <GitBranch className="w-4 h-4" />
            <span className="font-medium">{currentBranch}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[280px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
            sideOffset={5}
          >
            {/* New Branch Button */}
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer outline-none"
              onSelect={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4" />
              New Branch
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            {/* Local Branches */}
            {branches && branches.local.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Local Branches
                </div>
                {branches.local.map((branch) => (
                  <DropdownMenu.Item
                    key={branch.name}
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
                    onSelect={() => !branch.isHead && handleCheckout(branch.name)}
                    disabled={branch.isHead || isCheckingOut}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {branch.isHead && (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                      <span className={`truncate ${branch.isHead ? 'font-semibold' : ''}`}>
                        {branch.name}
                      </span>
                    </div>
                    {branch.upstream && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        → {branch.upstream}
                      </span>
                    )}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
              </>
            )}

            {/* Remote Branches */}
            {branches && branches.remote.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Remote Branches
                </div>
                {branches.remote.map((branch) => (
                  <DropdownMenu.Item
                    key={`${branch.remote}/${branch.name}`}
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
                    onSelect={() => handleCheckout(branch.name)}
                    disabled={isCheckingOut}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">
                        {branch.remote}/{branch.name}
                      </span>
                    </div>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
              </>
            )}

            {/* Tags Section (Placeholder) */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none">
                <Tag className="w-4 h-4" />
                Tags
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    No tags available
                  </div>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            {/* Revision/Commit Section (Placeholder) */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none">
                <GitCommit className="w-4 h-4" />
                Go to Revision
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="min-w-[240px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="Enter commit hash or ref..."
                      className="w-full px-2 py-1 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            {isLoading && (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Loading branches...
              </div>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <CreateBranchDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          loadBranches();
        }}
      />
    </>
  );
}
