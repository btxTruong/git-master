import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  Edit2,
  Trash2,
  Download,
  FolderPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useArchiveStore, type RestoreOptions } from '@/stores/archiveStore';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { getArchiveDiffContent } from '@/api/changelist';
import toast from 'react-hot-toast';

interface ArchiveContextMenuProps {
  archiveName: string;
  children: React.ReactNode;
}

interface Position {
  x: number;
  y: number;
}

/**
 * Dialog for configuring restore options
 */
function RestoreDialog({
  isOpen,
  onClose,
  onConfirm,
  archiveName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: RestoreOptions) => void;
  archiveName: string;
}) {
  const [createBackup, setCreateBackup] = useState(true);
  const [useThreeWay, setUseThreeWay] = useState(true);
  const [allowReject, setAllowReject] = useState(true);
  const [modifyIndex, setModifyIndex] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const options: RestoreOptions = {
      createBackup,
      useThreeWay,
      allowReject,
      modifyIndex,
    };
    onConfirm(options);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Restore Archive
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure options for restoring &quot;{archiveName}&quot;
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Create Backup */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createBackup}
              onChange={(e) => setCreateBackup(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Create Backup
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Create a stash backup before restoring
              </div>
            </div>
          </label>

          {/* Use Three-Way Merge */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useThreeWay}
              onChange={(e) => setUseThreeWay(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Use Three-Way Merge
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Better conflict resolution using base version
              </div>
            </div>
          </label>

          {/* Allow Reject Files */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowReject}
              onChange={(e) => setAllowReject(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Allow Reject Files
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Create .rej files for conflicts that cannot be resolved
              </div>
            </div>
          </label>

          {/* Modify Index */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={modifyIndex}
              onChange={(e) => setModifyIndex(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Modify Index
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Stage the restored changes automatically
              </div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Restore
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Dialog for renaming an archive
 */
function RenameDialog({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  existingNames,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
  existingNames: string[];
}) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  const [initialized, setInitialized] = useState(false);

  if (isOpen && !initialized) {
    setNewName(currentName);
    setError(null);
    setInitialized(true);
  } else if (!isOpen && initialized) {
    setInitialized(false);
  }

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Validation
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError('Archive name cannot be empty');
      return;
    }

    if (trimmedName === currentName) {
      setError('New name must be different from current name');
      return;
    }

    if (existingNames.includes(trimmedName)) {
      setError('An archive with this name already exists');
      return;
    }

    // Check for invalid characters
    if (/[/\\:*?"<>|]/.test(trimmedName)) {
      setError('Archive name contains invalid characters');
      return;
    }

    onConfirm(trimmedName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rename Archive</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              New Name
            </span>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Enter new archive name"
            />
          </label>
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Rename
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Context menu for archive actions
 */
export function ArchiveContextMenu({ archiveName, children }: ArchiveContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { archives, restoreArchive, renameArchive, deleteArchive } = useArchiveStore();
  const { createGroup } = useChangelistStore();
  const currentRepository = useRepositoryStore((state) => state.currentRepository);

  // Get list of existing archive names for validation
  const existingArchiveNames = archives.map((a) => a.archiveName).filter((n) => n !== archiveName);

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
    const menuHeight = 300;
    const padding = 10;

    let x = e.clientX;
    let y = e.clientY;

    // Adjust horizontal position if menu would overflow right edge
    if (x + menuWidth > viewportWidth - padding) {
      x = Math.max(padding, viewportWidth - menuWidth - padding);
    }

    // Adjust vertical position if menu would overflow bottom edge
    if (y + menuHeight > viewportHeight - padding) {
      y = Math.max(padding, e.clientY - menuHeight);
      if (y < padding) {
        y = padding;
      }
    }

    x = Math.max(padding, Math.min(x, viewportWidth - menuWidth - padding));
    y = Math.max(padding, Math.min(y, viewportHeight - menuHeight - padding));

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleMenuItemClick = (action: () => void | Promise<void>) => {
    setIsOpen(false);
    action();
  };

  const handleRestore = () => {
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async (options: RestoreOptions) => {
    setIsRestoreDialogOpen(false);

    try {
      await restoreArchive(archiveName, options);
    } catch (error) {
      // Error is already handled in the store
      console.error('Failed to restore archive:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!currentRepository) {
      toast.error('No repository selected');
      return;
    }

    try {
      // Create a new group with the archive name as prefix
      const groupName = `${archiveName} (restored)`;
      await createGroup(currentRepository.path, groupName);

      toast.success(`Created group "${groupName}" from archive`);
    } catch (error) {
      // Error is already handled in the store
      console.error('Failed to create group from archive:', error);
    }
  };

  const handleRename = () => {
    setIsRenameDialogOpen(true);
  };

  const handleConfirmRename = async (newName: string) => {
    setIsRenameDialogOpen(false);

    try {
      await renameArchive(archiveName, newName);
    } catch (error) {
      // Error is already handled in the store
      console.error('Failed to rename archive:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete archive "${archiveName}"?`)) {
      return;
    }

    try {
      await deleteArchive(archiveName);
    } catch (error) {
      // Error is already handled in the store
      console.error('Failed to delete archive:', error);
    }
  };

  const handleExport = async () => {
    try {
      // Get the diff content for this archive
      const diffContent = await getArchiveDiffContent(archiveName);

      // Create a blob with the diff content
      const blob = new Blob([diffContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${archiveName}.patch`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported "${archiveName}" as patch file`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export archive';
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
      {/* Restore */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleRestore)}
      >
        <RotateCcw className="w-4 h-4" />
        Restore Archive...
      </button>

      {/* Create Group from Archive */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleCreateGroup)}
      >
        <FolderPlus className="w-4 h-4" />
        Create Group from Archive
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      {/* Rename */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleRename)}
      >
        <Edit2 className="w-4 h-4" />
        Rename
      </button>

      {/* Export */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        onClick={() => handleMenuItemClick(handleExport)}
      >
        <Download className="w-4 h-4" />
        Export as Patch
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      {/* Delete */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
        onClick={() => handleMenuItemClick(handleDelete)}
      >
        <Trash2 className="w-4 h-4" />
        Delete Archive
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

      {/* Dialogs */}
      <RestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleConfirmRestore}
        archiveName={archiveName}
      />

      <RenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onConfirm={handleConfirmRename}
        currentName={archiveName}
        existingNames={existingArchiveNames}
      />
    </>
  );
}
