import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  GitCommit,
  RotateCcw,
  FolderInput,
  History,
  FileCode,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import toast from 'react-hot-toast';

interface FileContextMenuProps {
  filePath: string;
  currentGroupId: string;
  children: React.ReactNode;
  onDiffClick?: () => void;
  onBlameClick?: () => void;
  onHistoryClick?: () => void;
}

interface Position {
  x: number;
  y: number;
}

export function FileContextMenu({
  filePath,
  currentGroupId,
  children,
  onDiffClick,
  onBlameClick,
  onHistoryClick,
}: FileContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { groups, removeFilesFromGroup, moveFilesBetweenGroups } = useChangelistStore();
  const currentRepository = useRepositoryStore((state) => state.currentRepository);

  // Filter groups to show only other groups (not current one) for move action
  const otherGroups = groups.filter((g) => g.id !== currentGroupId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMoveMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
      setIsMoveMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsMoveMenuOpen(false);
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
    const menuHeight = 400;
    const padding = 10;

    let x = e.clientX;
    let y = e.clientY;

    // Adjust horizontal position if menu would overflow right edge
    if (x + menuWidth > viewportWidth - padding) {
      x = Math.max(padding, viewportWidth - menuWidth - padding);
    }

    // Adjust vertical position if menu would overflow bottom edge
    if (y + menuHeight > viewportHeight - padding) {
      // Position menu above cursor
      y = Math.max(padding, e.clientY - menuHeight);

      // If it still doesn't fit above, position it at the top with padding
      if (y < padding) {
        y = padding;
      }
    }

    // Ensure minimum padding from edges
    x = Math.max(padding, Math.min(x, viewportWidth - menuWidth - padding));
    y = Math.max(padding, Math.min(y, viewportHeight - menuHeight - padding));

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleMenuItemClick = (action: () => void | Promise<void>) => {
    setIsOpen(false);
    setIsMoveMenuOpen(false);
    action();
  };

  const handleRevertFile = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to revert changes in "${filePath}"?`)) {
      return;
    }

    try {
      // Import dynamically to avoid circular dependencies
      const { RevertFileChanges } = await import('../../../wailsjs/go/services/StagingService');
      const { services } = await import('../../../wailsjs/go/models');

      // Revert both staged and unstaged changes
      const revertOptions = new services.RevertOptions({
        RevertStagedChanges: true,
        RevertUnstagedChanges: true,
        DeleteUntrackedFiles: false,
      });

      await RevertFileChanges(currentRepository.path, revertOptions);

      // Remove file from changelist after reverting
      await removeFilesFromGroup(currentRepository.path, currentGroupId, [filePath]);

      toast.success(`Reverted changes in "${filePath}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revert file';
      toast.error(message);
    }
  };

  const handleCommitFile = () => {
    // This would trigger a commit dialog with just this file
    // Implementation depends on commit dialog component
    toast('Commit dialog not yet implemented');
  };

  const handleRemoveFromGroup = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    try {
      await removeFilesFromGroup(currentRepository.path, currentGroupId, [filePath]);
      toast.success(`Removed "${filePath}" from group`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove file from group';
      toast.error(message);
    }
  };

  const handleMoveToGroup = async (targetGroupId: string) => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    const targetGroup = groups.find((g) => g.id === targetGroupId);
    if (!targetGroup) {
      toast.error('Target group not found');
      return;
    }

    try {
      await moveFilesBetweenGroups(currentRepository.path, currentGroupId, targetGroupId, [
        filePath,
      ]);
      toast.success(`Moved "${filePath}" to "${targetGroup.name}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move file';
      toast.error(message);
    }
  };

  const handleShowDiff = () => {
    if (onDiffClick) {
      onDiffClick();
    } else {
      toast('Diff view not yet implemented');
    }
  };

  const handleShowBlame = () => {
    if (onBlameClick) {
      onBlameClick();
    } else {
      toast('Blame view not yet implemented');
    }
  };

  const handleShowHistory = () => {
    if (onHistoryClick) {
      onHistoryClick();
    } else {
      toast('History view not yet implemented');
    }
  };

  const handleCreatePatch = () => {
    toast('Create patch not yet implemented');
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
      {/* View Actions */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleShowDiff)}
      >
        <FileText className="w-4 h-4" />
        Show Diff
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleShowBlame)}
      >
        <FileCode className="w-4 h-4" />
        Show Blame
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleShowHistory)}
      >
        <History className="w-4 h-4" />
        Show History
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      {/* Modification Actions */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCommitFile)}
      >
        <GitCommit className="w-4 h-4" />
        Commit File...
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
        onClick={() => handleMenuItemClick(handleRevertFile)}
      >
        <RotateCcw className="w-4 h-4" />
        Revert Changes
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      {/* Group Actions */}
      {otherGroups.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setIsMoveMenuOpen(true)}
          onMouseLeave={() => setIsMoveMenuOpen(false)}
        >
          <button className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Move to Group
            </div>
            <span className="text-xs">▶</span>
          </button>

          {isMoveMenuOpen && (
            <div
              className="absolute left-full top-0 ml-1 min-w-[200px] max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
              style={{ zIndex: 10000 }}
            >
              {otherGroups.map((group) => (
                <button
                  key={group.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  onClick={() => handleMenuItemClick(() => handleMoveToGroup(group.id))}
                >
                  <FolderInput className="w-4 h-4" />
                  {group.name}
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {group.items.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleRemoveFromGroup)}
      >
        <Trash2 className="w-4 h-4" />
        Remove from Group
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      {/* Patch Actions */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCreatePatch)}
      >
        <FileText className="w-4 h-4" />
        Create Patch
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
            setIsMoveMenuOpen(false);
          }
        }}
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {menuContent && createPortal(menuContent, document.body)}
    </>
  );
}
