import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderOpen, GitBranch, RefreshCw, Play, Pause } from 'lucide-react';
import { ChangelistPanel } from '@/components/changelist/ChangelistPanel';
import { DiffPreviewPane } from '@/components/changelist/DiffPreviewPane';
import { BlameViewer } from '@/components/blame/BlameViewer';
import { FileHistoryDialog } from '@/components/changelist/FileHistoryDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useChangelistStore } from '@/stores/changelistStore';
import { useStagingStore } from '@/stores/stagingStore';
import { getWorkingDirectoryStatus } from '@/api/staging';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut';
import type { StagingFileChange, BlameResult } from '@/types/git';

const MIN_CHANGELIST_PERCENT = 25;
const MAX_CHANGELIST_PERCENT = 75;
const DEFAULT_CHANGELIST_PERCENT = 40;

// Auto-refresh interval in milliseconds
const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

/**
 * Main Changes view that integrates the changelist panel and diff preview pane.
 * Features:
 * - Two-column layout with resizable splitter
 * - Auto-refresh on Git status changes
 * - Loading and error states
 * - Keyboard shortcuts support
 */
function ChangesView() {
  const { currentRepository } = useRepositoryStore();
  const {
    loadAllChangelistGroups,
    reconcileWithGitStatus,
    createGroup,
    deleteGroup,
    selectedGroupId,
    setSelectedGroup,
    groups,
  } = useChangelistStore();
  const { loadChanges: loadStagingChanges } = useStagingStore();

  const [selectedFile, setSelectedFile] = useState<StagingFileChange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changelistPercent, setChangelistPercent] = useState(DEFAULT_CHANGELIST_PERCENT);
  const [isResizing, setIsResizing] = useState(false);

  // Blame viewer state
  // Note: These states are prepared for future integration when FileContextMenu
  // is connected to FileItem/FileTree components
  const [isBlameViewerOpen, setIsBlameViewerOpen] = useState(false);
  const [blameData, setBlameData] = useState<BlameResult | null>(null);

  // File history dialog state
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyFilePath, setHistoryFilePath] = useState<string>('');

  // Auto-refresh state
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  // Dialog state for keyboard shortcuts
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  const changelistPanelRef = useRef<HTMLDivElement>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatusRef = useRef<string>('');

  // Auto-refresh: poll git status and reconcile changelists
  const refreshGitStatus = useCallback(async () => {
    if (!currentRepository?.path) return;

    try {
      // Load git status into staging store (this updates the store which the selectors read from)
      await loadStagingChanges();

      // Get current Git status for reconciliation
      const status = await getWorkingDirectoryStatus();

      // Create a signature of current status to detect changes
      const statusSignature = JSON.stringify({
        staged: status.stagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
        unstaged: status.unstagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
        untracked: status.untrackedFiles.map((f) => `${f.path}:${f.status}`).sort(),
      });

      // If status changed, reconcile changelists
      if (lastStatusRef.current !== statusSignature) {
        lastStatusRef.current = statusSignature;

        // Reconcile changelists with current git status
        await reconcileWithGitStatus(currentRepository.path, statusSignature);

        // If selected file no longer exists in status, clear selection
        if (selectedFile) {
          const allFiles = [
            ...status.stagedFiles,
            ...status.unstagedFiles,
            ...status.untrackedFiles,
          ];
          const fileStillExists = allFiles.some((f) => f.path === selectedFile.path);
          if (!fileStillExists) {
            setSelectedFile(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh git status:', err);
      // Don't set error state for auto-refresh failures to avoid disrupting UX
    }
  }, [currentRepository, reconcileWithGitStatus, selectedFile, loadStagingChanges]);

  // Load initial data on mount
  useEffect(() => {
    if (currentRepository?.path) {
      setIsLoading(true);
      setError(null);

      Promise.all([
        loadAllChangelistGroups(currentRepository.path),
        loadStagingChanges(),
      ])
        .catch((err: unknown) => {
          console.error('Failed to load changelists:', err);
          setError(err instanceof Error ? err.message : 'Failed to load changelists');
        })
        .finally(() => {
          setIsLoading(false);
        });

      setSelectedFile(null);
    }
  }, [currentRepository?.path, loadAllChangelistGroups, loadStagingChanges]);

  // Set up auto-refresh timer
  useEffect(() => {
    if (currentRepository?.path && isAutoRefreshEnabled) {
      // Set up interval for periodic refresh
      autoRefreshTimerRef.current = setInterval(refreshGitStatus, AUTO_REFRESH_INTERVAL);

      return () => {
        if (autoRefreshTimerRef.current) {
          clearInterval(autoRefreshTimerRef.current);
          autoRefreshTimerRef.current = null;
        }
      };
    }
  }, [currentRepository?.path, refreshGitStatus, isAutoRefreshEnabled]);

  // Handle file selection
  const handleFileSelect = useCallback((file: StagingFileChange) => {
    setSelectedFile(file);
  }, []);

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    refreshGitStatus();
  }, [refreshGitStatus]);

  // Handle closing blame viewer
  const handleCloseBlameViewer = useCallback(() => {
    setIsBlameViewerOpen(false);
    setBlameData(null);
  }, []);

  // Handle showing file history
  const handleShowHistory = useCallback((filePath: string) => {
    setHistoryFilePath(filePath);
    setIsHistoryDialogOpen(true);
  }, []);

  // Handle closing file history dialog
  const handleCloseHistoryDialog = useCallback(() => {
    setIsHistoryDialogOpen(false);
    setHistoryFilePath('');
  }, []);

  // Note: handleShowBlame will be added when FileContextMenu is integrated with FileItem/FileTree
  // The BlameViewer component and backend service are ready for use

  // Resizable splitter handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !changelistPanelRef.current) return;

      const containerRect = changelistPanelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = e.clientX - containerRect.left;
      const newPercent = (newWidth / containerRect.width) * 100;

      if (newPercent >= MIN_CHANGELIST_PERCENT && newPercent <= MAX_CHANGELIST_PERCENT) {
        setChangelistPercent(newPercent);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts for Working Changes
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  const modifierKey = isMac ? 'metaKey' : 'ctrlKey';

  useKeyboardShortcuts(
    [
      {
        key: 'n',
        [modifierKey]: true,
        callback: () => {
          if (!currentRepository) return;
          setShowCreateGroupDialog(true);
        },
        description: 'Create new group',
      },
      {
        key: 's',
        [modifierKey]: true,
        callback: () => {
          if (!currentRepository || !selectedGroupId) return;
          // Dispatch custom event for commit action
          // This will be handled by ChangelistPanel or a future commit integration
          window.dispatchEvent(
            new CustomEvent('changelist:commit-group', { detail: { groupId: selectedGroupId } })
          );
        },
        description: 'Commit selected group',
      },
      {
        key: 'd',
        [modifierKey]: true,
        callback: () => {
          if (!selectedFile) return;
          // File is already selected, diff is showing in preview pane
          // We could scroll to ensure it's visible or focus the pane
          const diffPane = document.querySelector('[data-diff-preview]');
          if (diffPane) {
            (diffPane as HTMLElement).focus();
          }
        },
        description: 'View diff for selected file',
      },
      {
        key: 'Delete',
        callback: () => {
          if (!currentRepository || !selectedGroupId) return;
          setShowDeleteConfirmDialog(true);
        },
        description: 'Delete selected group',
      },
      {
        key: 'Escape',
        callback: () => {
          // Close dialogs first
          if (showCreateGroupDialog) {
            setShowCreateGroupDialog(false);
            return;
          }
          if (showDeleteConfirmDialog) {
            setShowDeleteConfirmDialog(false);
            return;
          }
          if (isBlameViewerOpen) {
            setIsBlameViewerOpen(false);
            return;
          }
          if (isHistoryDialogOpen) {
            setIsHistoryDialogOpen(false);
            return;
          }

          // Then clear selections
          if (selectedFile) {
            setSelectedFile(null);
            return;
          }
          if (selectedGroupId) {
            setSelectedGroup(null);
          }
        },
        description: 'Close dialogs/deselect',
      },
      {
        key: 'ArrowDown',
        callback: (e) => {
          // Navigate to next file/group
          e.preventDefault();
          // This will be enhanced when we have better navigation support
          const focusableElements = document.querySelectorAll(
            '[data-file-item], [data-group-item]'
          );
          const currentIndex = Array.from(focusableElements).findIndex(
            (el) => el === document.activeElement || el.contains(document.activeElement)
          );
          if (currentIndex < focusableElements.length - 1) {
            (focusableElements[currentIndex + 1] as HTMLElement).focus();
          }
        },
        description: 'Navigate down',
        preventDefault: true,
      },
      {
        key: 'ArrowUp',
        callback: (e) => {
          // Navigate to previous file/group
          e.preventDefault();
          const focusableElements = document.querySelectorAll(
            '[data-file-item], [data-group-item]'
          );
          const currentIndex = Array.from(focusableElements).findIndex(
            (el) => el === document.activeElement || el.contains(document.activeElement)
          );
          if (currentIndex > 0) {
            (focusableElements[currentIndex - 1] as HTMLElement).focus();
          }
        },
        description: 'Navigate up',
        preventDefault: true,
      },
      {
        key: 'r',
        [modifierKey]: true,
        callback: () => {
          handleManualRefresh();
        },
        description: 'Refresh',
      },
    ],
    {
      enabled: !!currentRepository,
    }
  );

  // Handle create group
  const handleCreateGroup = useCallback(
    async (groupName: string) => {
      if (!currentRepository?.path) return;
      try {
        await createGroup(currentRepository.path, groupName);
        setShowCreateGroupDialog(false);
      } catch (error) {
        // Error is already handled in the store
        console.error('Failed to create group:', error);
      }
    },
    [currentRepository, createGroup]
  );

  // Handle delete group
  const handleDeleteGroup = useCallback(async () => {
    if (!currentRepository?.path || !selectedGroupId) return;
    try {
      await deleteGroup(currentRepository.path, selectedGroupId);
      setShowDeleteConfirmDialog(false);
    } catch (error) {
      // Error is already handled in the store
      console.error('Failed to delete group:', error);
    }
  }, [currentRepository, selectedGroupId, deleteGroup]);

  // Empty state - no repository
  if (!currentRepository) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <EmptyState
          icon={<FolderOpen className="w-16 h-16 text-gray-400" />}
          title="No Repository Open"
          description="Open a Git repository to view and manage working changes"
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading changelists...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
            <span className="text-red-600 dark:text-red-400 text-2xl">!</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Failed to Load Changelists
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (currentRepository?.path) {
                loadAllChangelistGroups(currentRepository.path)
                  .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : 'Failed to load changelists');
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Working Changes
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
              className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
                isAutoRefreshEnabled
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={
                isAutoRefreshEnabled
                  ? 'Auto-refresh enabled (click to disable)'
                  : 'Auto-refresh disabled (click to enable)'
              }
            >
              {isAutoRefreshEnabled ? (
                <>
                  <Pause className="w-4 h-4" />
                  Auto
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Auto
                </>
              )}
            </button>

            <button
              onClick={handleManualRefresh}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
              title="Refresh (Cmd/Ctrl+R)"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {currentRepository && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currentRepository.name} · {currentRepository.currentBranch}
          </p>
        )}
      </div>

      {/* Main content: two-column layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Changelist panel */}
        <div
          ref={changelistPanelRef}
          className="overflow-hidden border-r border-gray-200 dark:border-gray-700 flex-shrink-0 relative"
          style={{ width: `${changelistPercent}%` }}
        >
          <ChangelistPanel
            onFileSelect={handleFileSelect}
            selectedFilePath={selectedFile?.path || null}
            onShowHistory={handleShowHistory}
            className="h-full"
          />

          {/* Resize handle */}
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors ${
              isResizing ? 'bg-blue-500' : 'bg-transparent'
            }`}
            onMouseDown={handleMouseDown}
            style={{ zIndex: 10 }}
          />
        </div>

        {/* Right: Diff preview pane */}
        <div className="flex-1 overflow-hidden">
          <DiffPreviewPane selectedFile={selectedFile} className="h-full" />
        </div>
      </div>

      {/* Blame Viewer Modal */}
      <BlameViewer
        isOpen={isBlameViewerOpen}
        onClose={handleCloseBlameViewer}
        blameData={blameData}
        isLoading={false}
      />

      {/* File History Dialog */}
      <FileHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={handleCloseHistoryDialog}
        filePath={historyFilePath}
      />

      {/* Create Group Dialog */}
      {showCreateGroupDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create New Group
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const groupName = formData.get('groupName') as string;
                if (groupName.trim()) {
                  handleCreateGroup(groupName.trim());
                }
              }}
            >
              <input
                type="text"
                name="groupName"
                placeholder="Enter group name"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupDialog(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Group
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;
              {groups.find((g) => g.id === selectedGroupId)?.name}
              &quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirmDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChangesView;
