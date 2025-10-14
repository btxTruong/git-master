import { useState, useEffect, useCallback, useRef } from 'react';
import { Archive, Upload, RefreshCw, FolderOpen } from 'lucide-react';
import { ArchiveList } from '@/components/archive/ArchiveList';
import { ArchiveDiffPreview } from '@/components/archive/ArchiveDiffPreview';
import { EmptyState } from '@/components/common/EmptyState';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useArchiveStore } from '@/stores/archiveStore';
import toast from 'react-hot-toast';

const MIN_ARCHIVE_LIST_PERCENT = 25;
const MAX_ARCHIVE_LIST_PERCENT = 75;
const DEFAULT_ARCHIVE_LIST_PERCENT = 40;

/**
 * Archives view that displays archived groups and provides management capabilities.
 * Features:
 * - Two-column layout with resizable splitter
 * - Archive list on the left, diff preview on the right
 * - Import patch functionality
 * - Auto-refresh when archives change
 */
function ArchivesView() {
  const { currentRepository } = useRepositoryStore();
  const { archives, selectedArchiveId, setSelectedArchive, loadArchives, isLoading, error } =
    useArchiveStore();

  const [archiveListPercent, setArchiveListPercent] = useState(DEFAULT_ARCHIVE_LIST_PERCENT);
  const [isResizing, setIsResizing] = useState(false);

  const archiveListPanelRef = useRef<HTMLDivElement>(null);

  // Get selected archive name for diff preview
  const selectedArchiveName = selectedArchiveId
    ? archives.find((a) => a.id === selectedArchiveId)?.archiveName || null
    : null;

  // Load archives on mount
  useEffect(() => {
    if (currentRepository?.path) {
      loadArchives();
    }
  }, [currentRepository, loadArchives]);

  // Handle archive selection
  const handleArchiveSelect = useCallback(
    (archiveId: string) => {
      setSelectedArchive(archiveId);
    },
    [setSelectedArchive]
  );

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    loadArchives();
  }, [loadArchives]);

  // Handle import patch
  const handleImportPatch = useCallback(() => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.patch,.diff';
    input.multiple = false;

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        // Read file content
        const content = await file.text();

        // For now, just show a success message
        // TODO: Implement actual patch import functionality
        toast.success(`Patch file "${file.name}" loaded. Import functionality coming soon.`);

        console.log('Patch content:', content);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to read patch file';
        toast.error(message);
      }
    };

    input.click();
  }, []);

  // Resizable splitter handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !archiveListPanelRef.current) return;

      const containerRect = archiveListPanelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = e.clientX - containerRect.left;
      const newPercent = (newWidth / containerRect.width) * 100;

      if (newPercent >= MIN_ARCHIVE_LIST_PERCENT && newPercent <= MAX_ARCHIVE_LIST_PERCENT) {
        setArchiveListPercent(newPercent);
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
      if (e.key === 'Escape' && selectedArchiveId) {
        e.preventDefault();
        setSelectedArchive(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualRefresh, selectedArchiveId, setSelectedArchive]);

  // Empty state - no repository
  if (!currentRepository) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <EmptyState
          icon={<FolderOpen className="w-16 h-16 text-gray-400" />}
          title="No Repository Open"
          description="Open a Git repository to view and manage archives"
        />
      </div>
    );
  }

  // Loading state
  if (isLoading && archives.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading archives...</p>
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
            Failed to Load Archives
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleManualRefresh}
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
            <Archive className="w-5 h-5" />
            Archives
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImportPatch}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
              title="Import Patch"
            >
              <Upload className="w-4 h-4" />
              Import Patch
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
        {/* Left: Archive list */}
        <div
          ref={archiveListPanelRef}
          className="overflow-hidden border-r border-gray-200 dark:border-gray-700 flex-shrink-0 relative"
          style={{ width: `${archiveListPercent}%` }}
        >
          <ArchiveList
            archives={archives}
            selectedArchiveId={selectedArchiveId}
            onSelectArchive={handleArchiveSelect}
            isLoading={isLoading}
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
          <ArchiveDiffPreview archiveName={selectedArchiveName} className="h-full" />
        </div>
      </div>
    </div>
  );
}

export default ArchivesView;
