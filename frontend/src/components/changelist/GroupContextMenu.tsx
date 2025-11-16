import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Archive, Edit3, Trash2, FileText, FolderPlus } from 'lucide-react';
import type { Changelist } from '@/types/changelist';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { ArchiveChangelistGroup } from '../../../wailsjs/go/services/ArchiveService';
import { models } from '../../../wailsjs/go/models';
import toast from 'react-hot-toast';

export type GroupAction = 'rename' | 'archive' | 'delete' | 'patch';

interface GroupContextMenuProps {
  group: Changelist;
  children: React.ReactNode;
  onAction?: (action: GroupAction) => void;
}

interface Position {
  x: number;
  y: number;
}

export function GroupContextMenu({ group, children, onAction }: GroupContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [archiveName, setArchiveName] = useState('');
  const [archiveDescription, setArchiveDescription] = useState('');
  const [archiveBeforeDelete, setArchiveBeforeDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { renameGroup, deleteGroup } = useChangelistStore();
  const currentRepository = useRepositoryStore((state) => state.currentRepository);

  // System-generated groups have limited actions
  const isSystemGroup = group.isSystemGenerated;

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
    const menuHeight = 350;
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

  const handleMenuItemClick = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const handleRename = () => {
    setNewGroupName(group.name);
    setShowRenameDialog(true);
    if (onAction) onAction('rename');
  };

  const handleArchive = () => {
    setArchiveName(`${group.name}-${new Date().toISOString().split('T')[0]}`);
    setArchiveDescription('');
    setShowArchiveDialog(true);
    if (onAction) onAction('archive');
  };

  const handleDelete = () => {
    setArchiveBeforeDelete(false);
    setShowDeleteDialog(true);
    if (onAction) onAction('delete');
  };

  const handleCreatePatch = async () => {
    try {
      const { createPatchForGroup, formatFileSize } = await import('@/api/patch');

      const result = await createPatchForGroup(group);
      toast.success(`Created patch file: ${result.path} (${formatFileSize(result.size)})`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Patch creation cancelled') {
        // User cancelled - don't show error
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to create patch';
      toast.error(message);
    }

    if (onAction) onAction('patch');
  };

  const confirmRename = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    if (!newGroupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    try {
      await renameGroup(currentRepository.path, group.id, newGroupName.trim());
      setShowRenameDialog(false);
      toast.success(`Renamed group to "${newGroupName}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename group';
      toast.error(message);
    }
  };

  const confirmArchive = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    if (!archiveName.trim()) {
      toast.error('Archive name cannot be empty');
      return;
    }

    try {
      const tags = archiveDescription.trim() ? [archiveDescription.trim()] : [];
      // Convert to Wails model
      const wailsGroup = new models.Changelist(group);
      await ArchiveChangelistGroup(wailsGroup, currentRepository.path, archiveName.trim(), tags);
      setShowArchiveDialog(false);
      toast.success(`Archived group as "${archiveName}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive group';
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    try {
      // Optionally archive before deleting
      if (archiveBeforeDelete) {
        const backupName = `${group.name}-backup-${new Date().toISOString().split('T')[0]}`;
        // Convert to Wails model
        const wailsGroup = new models.Changelist(group);
        await ArchiveChangelistGroup(wailsGroup, currentRepository.path, backupName, []);
        toast.success(`Archived as "${backupName}"`);
      }

      await deleteGroup(currentRepository.path, group.id);
      setShowDeleteDialog(false);
      toast.success(`Deleted group "${group.name}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete group';
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
      {/* Create Patch */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCreatePatch)}
      >
        <FileText className="w-4 h-4" />
        Create Patch
      </button>

      {!isSystemGroup && (
        <>
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          {/* Rename Group */}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            onClick={() => handleMenuItemClick(handleRename)}
          >
            <Edit3 className="w-4 h-4" />
            Rename Group
          </button>

          {/* Archive Group */}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            onClick={() => handleMenuItemClick(handleArchive)}
          >
            <Archive className="w-4 h-4" />
            Archive Group
          </button>

          {/* Delete Group */}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
            onClick={() => handleMenuItemClick(handleDelete)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Group
          </button>
        </>
      )}
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

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Rename Group
            </h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Group name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setShowRenameDialog(false);
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmRename}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Rename
              </button>
              <button
                onClick={() => setShowRenameDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Dialog */}
      {showArchiveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Archive Group
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Archive Name
                </label>
                <input
                  type="text"
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Archive name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={archiveDescription}
                  onChange={(e) => setArchiveDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Archive description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmArchive}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Archive className="w-4 h-4 inline mr-2" />
                Archive
              </button>
              <button
                onClick={() => setShowArchiveDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Delete Group
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;{group.name}&quot;? This action cannot be
              undone.
            </p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={archiveBeforeDelete}
                onChange={(e) => setArchiveBeforeDelete(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <FolderPlus className="w-4 h-4 inline mr-1" />
                Archive before deleting
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
