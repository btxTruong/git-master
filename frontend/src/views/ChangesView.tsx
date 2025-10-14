import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderOpen, GitBranch, RefreshCw } from 'lucide-react';
import { ChangelistPanel } from '@/components/changelist/ChangelistPanel';
import { DiffPreviewPane } from '@/components/changelist/DiffPreviewPane';
import { EmptyState } from '@/components/common/EmptyState';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useChangelistStore } from '@/stores/changelistStore';
import { getWorkingDirectoryStatus } from '@/api/staging';
import type { StagingFileChange } from '@/types/git';

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
  const { loadAllChangelistGroups, reconcileWithGitStatus } = useChangelistStore();

  const [selectedFile, setSelectedFile] = useState<StagingFileChange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changelistPercent, setChangelistPercent] = useState(DEFAULT_CHANGELIST_PERCENT);
  const [isResizing, setIsResizing] = useState(false);

  const changelistPanelRef = useRef<HTMLDivElement>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatusRef = useRef<string>('');

  // Load changelists on mount
  useEffect(() => {
    if (currentRepository?.path) {
      setIsLoading(true);
      setError(null);

      loadAllChangelistGroups(currentRepository.path)
        .catch((err: unknown) => {
          console.error('Failed to load changelists:', err);
          setError(err instanceof Error ? err.message : 'Failed to load changelists');
        })
        .finally(() => {
          setIsLoading(false);
        });

      // Reset selected file when repository changes
      setSelectedFile(null);
    }
  }, [currentRepository, loadAllChangelistGroups]);

  // Auto-refresh: poll git status and reconcile changelists
  const refreshGitStatus = useCallback(async () => {
    if (!currentRepository?.path) return;

    try {
      // Get current Git status
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
  }, [currentRepository, reconcileWithGitStatus, selectedFile]);

  // Set up auto-refresh timer
  useEffect(() => {
    if (currentRepository?.path) {
      // Initial refresh
      refreshGitStatus();

      // Set up interval
      autoRefreshTimerRef.current = setInterval(refreshGitStatus, AUTO_REFRESH_INTERVAL);

      return () => {
        if (autoRefreshTimerRef.current) {
          clearInterval(autoRefreshTimerRef.current);
          autoRefreshTimerRef.current = null;
        }
      };
    }
  }, [currentRepository, refreshGitStatus]);

  // Handle file selection
  const handleFileSelect = useCallback((file: StagingFileChange) => {
    setSelectedFile(file);
  }, []);

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    refreshGitStatus();
  }, [refreshGitStatus]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + R: Refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleManualRefresh();
      }

      // Escape: Clear selection
      if (e.key === 'Escape' && selectedFile) {
        e.preventDefault();
        setSelectedFile(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualRefresh, selectedFile]);

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

          <button
            onClick={handleManualRefresh}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
            title="Refresh (Cmd/Ctrl+R)"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
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
    </div>
  );
}

export default ChangesView;
