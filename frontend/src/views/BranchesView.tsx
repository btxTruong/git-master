import { useState, useEffect } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { CreateBranchDialog } from '@/components/branch/CreateBranchDialog';
import { MergeDialog } from '@/components/merge/MergeDialog';
import { RebaseDialog } from '@/components/rebase/RebaseDialog';
import { DeleteBranchDialog } from '@/components/branch/DeleteBranchDialog';
import {
  FolderOpen,
  GitBranch,
  Plus,
  MoreVertical,
  GitMerge,
  GitCompare,
  Trash2,
  Check,
  Globe
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
// Import from services will be added after backend implementation
// import { GetAllBranches } from '../../../wailsjs/go/services/BranchService';
import toast from 'react-hot-toast';

interface Branch {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  lastCommit: string;
  lastCommitMessage: string;
  lastCommitAuthor: string;
  lastCommitDate: string;
}

function BranchesView() {
  const { currentRepository } = useRepositoryStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [_showRebaseDialog, setShowRebaseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (currentRepository) {
      loadBranches();
    }
  }, [currentRepository]);

  const loadBranches = async () => {
    if (!currentRepository) return;

    try {
      // TODO: Implement GetAllBranches from backend
      // const result = await GetAllBranches();
      // setBranches(result || []);
      setBranches([]);
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast.error(`Failed to load branches: ${error}`);
    }
  };

  const handleMerge = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowMergeDialog(true);
  };

  const handleRebase = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowRebaseDialog(true);
  };

  const handleDelete = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDeleteDialog(true);
  };

  if (!currentRepository) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={<FolderOpen className="w-16 h-16 text-gray-400" />}
          title="No Repository Open"
          description="Open a Git repository to manage branches"
        />
      </div>
    );
  }

  const localBranches = branches.filter(b => !b.isRemote);
  const remoteBranches = branches.filter(b => b.isRemote);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Branches
          </h1>
          <Button
            variant="primary"
            onClick={() => setShowCreateDialog(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Branch
          </Button>
        </div>
      </div>

      {/* Branch List */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Local Branches */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Local Branches ({localBranches.length})
          </h2>
          <div className="space-y-2">
            {localBranches.map((branch) => (
              <BranchItem
                key={branch.name}
                branch={branch}
                onMerge={() => handleMerge(branch)}
                onRebase={() => handleRebase(branch)}
                onDelete={() => handleDelete(branch)}
              />
            ))}
          </div>
        </div>

        {/* Remote Branches */}
        {remoteBranches.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Remote Branches ({remoteBranches.length})
            </h2>
            <div className="space-y-2">
              {remoteBranches.map((branch) => (
                <BranchItem
                  key={branch.name}
                  branch={branch}
                  onMerge={() => handleMerge(branch)}
                  onRebase={() => handleRebase(branch)}
                  onDelete={() => handleDelete(branch)}
                  isRemote
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateBranchDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          loadBranches();
        }}
      />
      <MergeDialog
        isOpen={showMergeDialog}
        onClose={() => {
          setShowMergeDialog(false);
          setSelectedBranch(null);
          loadBranches();
        }}
      />
      <RebaseDialog
        onClose={() => {
          setShowRebaseDialog(false);
          setSelectedBranch(null);
          loadBranches();
        }}
        targetBranch={selectedBranch?.name || ''}
      />
      <DeleteBranchDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedBranch(null);
          loadBranches();
        }}
        branchName={selectedBranch?.name || null}
      />
    </div>
  );
}

interface BranchItemProps {
  branch: Branch;
  onMerge: () => void;
  onRebase: () => void;
  onDelete: () => void;
  isRemote?: boolean;
}

function BranchItem({ branch, onMerge, onRebase, onDelete, isRemote }: BranchItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        branch.isCurrent
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {branch.isCurrent && (
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          )}
          <span className={`font-medium truncate ${
            branch.isCurrent
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {branch.name}
          </span>
          {isRemote && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              remote
            </span>
          )}
        </div>
        {branch.lastCommitMessage && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
            {branch.lastCommitMessage}
          </div>
        )}
        {branch.lastCommitAuthor && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {branch.lastCommitAuthor} · {branch.lastCommitDate}
          </div>
        )}
      </div>

      {/* Actions dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Branch actions"
          >
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1"
            sideOffset={5}
          >
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
              onSelect={onMerge}
            >
              <GitMerge className="w-4 h-4" />
              Merge into current
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
              onSelect={onRebase}
            >
              <GitCompare className="w-4 h-4" />
              Rebase current onto this
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

            {!branch.isCurrent && (
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer outline-none"
                onSelect={onDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete branch
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export default BranchesView;
