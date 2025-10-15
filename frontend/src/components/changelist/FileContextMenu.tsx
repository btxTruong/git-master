import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  GitCommit,
  RotateCcw,
  FolderInput,
  History,
  FileCode,
  ArrowRightLeft,
  Copy,
} from 'lucide-react';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useStagingStore } from '@/stores/stagingStore';
import { useTrackedGroup, useUntrackedGroup } from '@/stores/selectors/changelistSelectors';
import { useRevertFile } from '@/hooks/useRevertFile';
import { useCommitFromGroup } from '@/hooks/useCommitFromGroup';
import { CommitDialog } from '@/components/staging/CommitDialog';
import { stageFile, unstageFile } from '@/api/staging';
import toast from 'react-hot-toast';
import { CHANGELIST_TYPE_CUSTOM } from '@/types/changelist';

interface FileContextMenuProps {
  filePath: string;
  currentGroupId: string;
  children: React.ReactNode;
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
  onBlameClick,
  onHistoryClick,
}: FileContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { groups, moveFilesBetweenGroups, addFilesToGroup, removeFilesFromGroup } = useChangelistStore();
  const currentRepository = useRepositoryStore((state) => state.currentRepository);
  const loadChanges = useStagingStore((state) => state.loadChanges);
  const { revertFile } = useRevertFile();
  const { commitFromGroup, isCommitDialogOpen, closeCommitDialog } = useCommitFromGroup();

  // Get derived groups
  const trackedGroup = useTrackedGroup();
  const untrackedGroup = useUntrackedGroup();

  // Build list of all groups (custom + derived) excluding current group
  const allGroups = [...groups];
  if (trackedGroup) allGroups.unshift(trackedGroup);
  if (untrackedGroup) allGroups.push(untrackedGroup);

  // Filter to show only other groups (not current one) for move action
  // Also exclude Untracked group as you cannot "move" files to untracked (they're already untracked)
  const otherGroups = allGroups.filter(
    (g) => g.id !== currentGroupId && g.id !== '__untracked__'
  );
  const currentGroup = allGroups.find((g) => g.id === currentGroupId);

  // Check group types
  const isUntrackedGroup = currentGroupId === '__untracked__';
  const isTrackedGroup = currentGroupId === '__tracked__';
  const isCustomGroup = currentGroup?.type === CHANGELIST_TYPE_CUSTOM;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is inside the menu
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
      // Use setTimeout to delay the event listener attachment
      // This prevents the opening right-click from immediately closing the menu
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('contextmenu', handleClickOutside);
      }, 100);

      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('contextmenu', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
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

  const handleMenuItemClick = useCallback((action: () => void | Promise<void>) => {
    // First close the menu
    setIsOpen(false);
    setIsMoveMenuOpen(false);

    // Then execute the action after a small delay to ensure menu closes first
    setTimeout(() => {
      action();
    }, 10);
  }, []);

  const handleRevertFile = async () => {
    await revertFile({
      filePath,
      groupId: currentGroupId,
    });
  };

  const handleCommitFile = async () => {
    if (!currentGroup) {
      toast.error('Group not found');
      return;
    }

    await commitFromGroup({
      groupId: currentGroupId,
      groupName: currentGroup.name,
      filePaths: [filePath],
    });
  };

  const handleMoveToGroup = async (targetGroupId: string) => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    const targetGroup = allGroups.find((g) => g.id === targetGroupId);
    if (!targetGroup) {
      toast.error('Target group not found');
      return;
    }

    try {
      // Handle moves involving tracked group
      if (isTrackedGroup) {
        // Moving from tracked to custom: unstage and add to custom group
        await unstageFile(filePath);
        await addFilesToGroup(currentRepository.path, targetGroupId, [filePath]);
        await loadChanges();
        toast.success(`Moved "${filePath}" to "${targetGroup.name}"`);
      } else if (isUntrackedGroup && targetGroup.type === CHANGELIST_TYPE_CUSTOM) {
        // Moving from untracked to custom: just add to group
        await addFilesToGroup(currentRepository.path, targetGroupId, [filePath]);
        toast.success(`Moved "${filePath}" to "${targetGroup.name}"`);
      } else if (isCustomGroup && targetGroup.type === CHANGELIST_TYPE_CUSTOM) {
        // Moving between custom groups
        await moveFilesBetweenGroups(currentRepository.path, currentGroupId, targetGroupId, [
          filePath,
        ]);
        toast.success(`Moved "${filePath}" to "${targetGroup.name}"`);
      } else {
        toast.error('This move operation is not supported');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move file';
      toast.error(message);
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

  const handleCreatePatch = async () => {
    try {
      const { createPatchForFiles, formatFileSize } = await import('@/api/patch');

      // Use the file name (without path) as the default name
      const fileName = filePath.split('/').pop() || 'file';
      const result = await createPatchForFiles([filePath], fileName);

      toast.success(`Created patch file: ${result.path} (${formatFileSize(result.size)})`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Patch creation cancelled') {
        // User cancelled - don't show error
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to create patch';
      toast.error(message);
    }
  };

  const handleCopyFilePath = async () => {
    try {
      await navigator.clipboard.writeText(filePath);
      toast.success(`Copied: ${filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy file path';
      toast.error(message);
    }
  };

  const handleMoveToTracked = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    try {
      // If moving from custom group, remove from group first
      if (isCustomGroup) {
        await removeFilesFromGroup(currentRepository.path, currentGroupId, [filePath]);
      }

      // Stage the file (this moves it to Tracked group)
      await stageFile(filePath);
      await loadChanges();
      toast.success(`Staged "${filePath}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stage file';
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
      {/* View Actions */}
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
      {(isUntrackedGroup || isCustomGroup) && (
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left"
          onClick={() => handleMenuItemClick(handleMoveToTracked)}
        >
          <FolderInput className="w-4 h-4" />
          Move to Tracked
        </button>
      )}

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

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      {/* File Actions */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCopyFilePath)}
      >
        <Copy className="w-4 h-4" />
        Copy File Path
      </button>

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
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {menuContent && createPortal(menuContent, document.body)}

      {/* Commit Dialog */}
      <CommitDialog isOpen={isCommitDialogOpen} onClose={closeCommitDialog} />
    </>
  );
}
