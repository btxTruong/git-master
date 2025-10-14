import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  FileText,
  Cherry,
  GitBranch,
  RotateCcw,
  Undo2,
  Tag,
  ArrowUp,
  ArrowDown,
  GitCommit,
  RefreshCw,
} from 'lucide-react';
import type { Commit } from '@/stores/commitStore';
import { NewBranchDialog } from './NewBranchDialog';
import { NewTagDialog } from './NewTagDialog';
import { SavePatchDialog } from './SavePatchDialog';
import toast from 'react-hot-toast';
import {
  checkoutCommit,
  resetBranch,
  revertCommit,
  cherryPickCommit,
  createPatchFile,
  createTag,
  createBranchAtCommit,
  getBranchesContainingCommit,
} from '@/api/commitOperations';
import { CheckoutBranch } from '../../../wailsjs/go/services/RepositoryService';

interface CommitContextMenuProps {
  commit: Commit;
  children: React.ReactNode;
  onOperationComplete?: () => void;
  allCommits?: Commit[];
  onSelectCommit?: (commit: Commit) => void;
}

interface Position {
  x: number;
  y: number;
}

export function CommitContextMenu({
  commit,
  children,
  onOperationComplete,
  allCommits = [],
  onSelectCommit,
}: CommitContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isNewBranchDialogOpen, setIsNewBranchDialogOpen] = useState(false);
  const [isNewTagDialogOpen, setIsNewTagDialogOpen] = useState(false);
  const [isSavePatchDialogOpen, setIsSavePatchDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if this commit has any children
  const hasChildren = allCommits.some((c) => c.parentHashes?.includes(commit.hash));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 240;
    const menuHeight = 450;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    if (x < 10) {
      x = 10;
    }

    if (y < 10) {
      y = 10;
    }

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleMenuItemClick = (action: () => void | Promise<void>) => {
    setIsOpen(false);
    action();
  };

  const handleCopyRevision = async () => {
    try {
      await navigator.clipboard.writeText(commit.hash);
      toast.success(`Copied revision: ${commit.shortHash}`);
    } catch {
      toast.error('Failed to copy revision number');
    }
  };

  const handleCreatePatch = async (filename: string, directory: string) => {
    await createPatchFile(commit.hash, filename, directory);
    toast.success(`Created patch file: ${filename}`);
    onOperationComplete?.();
  };

  const handleCherryPick = async () => {
    try {
      await cherryPickCommit(commit.hash);
      toast.success(`Cherry-picked commit ${commit.shortHash}`);
      onOperationComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cherry-pick commit';
      toast.error(message);
    }
  };

  const handleCheckoutCommit = async () => {
    try {
      await checkoutCommit(commit.hash);
      toast.success(`Checked out commit ${commit.shortHash} (detached HEAD)`);
      onOperationComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to checkout commit';
      toast.error(message);
    }
  };

  const handleResetBranch = async (mode: 'soft' | 'mixed' | 'hard') => {
    try {
      await resetBranch(commit.hash, mode);
      const modeText = mode === 'soft' ? 'Soft' : mode === 'mixed' ? 'Mixed' : 'Hard';
      toast.success(`${modeText} reset to commit ${commit.shortHash}`);
      onOperationComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset branch';
      toast.error(message);
    }
  };

  const handleRevertCommit = async () => {
    try {
      await revertCommit(commit.hash);
      toast.success(`Reverted commit ${commit.shortHash}`);
      onOperationComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revert commit';
      toast.error(message);
    }
  };

  const handleNewBranch = async (branchName: string, checkout: boolean) => {
    await createBranchAtCommit(branchName, commit.hash);
    if (checkout) {
      await CheckoutBranch(branchName);
    }
    toast.success(
      `Created branch "${branchName}" at ${commit.shortHash}${checkout ? ' and checked out' : ''}`
    );
    onOperationComplete?.();
  };

  const handleNewTag = async (tagName: string, message: string) => {
    await createTag(tagName, commit.hash, message);
    toast.success(`Created tag "${tagName}" at ${commit.shortHash}`);
    onOperationComplete?.();
  };

  const handleGoToParent = () => {
    if (commit.parentHashes && commit.parentHashes.length > 0) {
      const parentHash = commit.parentHashes[0];
      const parentCommit = allCommits.find((c) => c.hash === parentHash);
      if (parentCommit && onSelectCommit) {
        onSelectCommit(parentCommit);
        toast.success(`Navigated to parent commit ${parentCommit.shortHash}`);
      } else {
        toast.error('Parent commit not found in current view');
      }
    } else {
      toast('No parent commit');
    }
  };

  const handleGoToChild = () => {
    const childCommit = allCommits.find((c) => c.parentHashes?.includes(commit.hash));
    if (childCommit && onSelectCommit) {
      onSelectCommit(childCommit);
      toast.success(`Navigated to child commit ${childCommit.shortHash}`);
    } else {
      toast.error('No child commit found in current view');
    }
  };

  const handleCopyBranchName = async () => {
    try {
      const branches = await getBranchesContainingCommit(commit.hash);
      if (branches.length === 0) {
        toast.error('No branches found containing this commit');
        return;
      }
      const branchName = branches[0];
      await navigator.clipboard.writeText(branchName);
      toast.success(`Copied branch name: ${branchName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy branch name';
      toast.error(message);
    }
  };

  const menuContent = isOpen ? (
    <div
      ref={menuRef}
      className="fixed min-w-[220px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCopyRevision)}
      >
        <Copy className="w-4 h-4" />
        Copy Revision Number
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => {
          setIsOpen(false);
          setIsSavePatchDialogOpen(true);
        }}
      >
        <FileText className="w-4 h-4" />
        Create Patch File
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCherryPick)}
      >
        <Cherry className="w-4 h-4" />
        Cherry-pick
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCheckoutCommit)}
      >
        <GitCommit className="w-4 h-4" />
        Checkout this Revision
      </button>

      <div className="relative group">
        <button className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset Current Branch to Here
          </div>
          <span className="text-xs">▶</span>
        </button>

        <div
          className="hidden group-hover:block absolute left-full top-0 ml-1 min-w-[180px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
          style={{ zIndex: 10000 }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            onClick={() => handleMenuItemClick(() => handleResetBranch('soft'))}
          >
            Soft Reset
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            onClick={() => handleMenuItemClick(() => handleResetBranch('mixed'))}
          >
            Mixed Reset
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            onClick={() => handleMenuItemClick(() => handleResetBranch('hard'))}
          >
            <span className="text-red-600 dark:text-red-400">Hard Reset</span>
          </button>
        </div>
      </div>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleRevertCommit)}
      >
        <RotateCcw className="w-4 h-4" />
        Revert Commit
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(() => handleResetBranch('soft'))}
      >
        <Undo2 className="w-4 h-4" />
        Undo Commit
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => {
          setIsOpen(false);
          setIsNewBranchDialogOpen(true);
        }}
      >
        <GitBranch className="w-4 h-4" />
        New Branch
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => {
          setIsOpen(false);
          setIsNewTagDialogOpen(true);
        }}
      >
        <Tag className="w-4 h-4" />
        New Tag
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => handleMenuItemClick(handleGoToChild)}
        disabled={!hasChildren}
      >
        <ArrowDown className="w-4 h-4" />
        Go To Child Commit
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => handleMenuItemClick(handleGoToParent)}
        disabled={!commit.parentHashes || commit.parentHashes.length === 0}
      >
        <ArrowUp className="w-4 h-4" />
        Go To Parent Commit
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCopyBranchName)}
      >
        <Copy className="w-4 h-4" />
        Copy Branch Name
      </button>
    </div>
  ) : null;

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onMouseEnter={() => {
          if (isOpen) {
            setIsOpen(false);
          }
        }}
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {menuContent && createPortal(menuContent, document.body)}

      <NewBranchDialog
        isOpen={isNewBranchDialogOpen}
        onClose={() => setIsNewBranchDialogOpen(false)}
        onConfirm={handleNewBranch}
        commitHash={commit.shortHash}
      />

      <NewTagDialog
        isOpen={isNewTagDialogOpen}
        onClose={() => setIsNewTagDialogOpen(false)}
        onConfirm={handleNewTag}
        commitHash={commit.shortHash}
      />

      <SavePatchDialog
        isOpen={isSavePatchDialogOpen}
        onClose={() => setIsSavePatchDialogOpen(false)}
        onConfirm={handleCreatePatch}
        commitHash={commit.shortHash}
      />
    </>
  );
}
