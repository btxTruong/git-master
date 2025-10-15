import { memo, useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDroppable } from '@dnd-kit/core';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  MoreVertical,
  Loader2,
  File,
  FolderTree,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { Changelist, ChangelistItem } from '@/types/changelist';
import {
  CHANGELIST_TYPE_CUSTOM,
  CHANGELIST_TYPE_TRACKED,
  CHANGELIST_TYPE_UNTRACKED,
} from '@/types/changelist';
import { FileTree } from '@/components/staging/FileTree';
import { FileContextMenu } from '@/components/changelist/FileContextMenu';
import { EmptyState } from '@/components/common/EmptyState';
import type { StagingFileChange } from '@/types/git';
import { FileStatus } from '@/types/git';
import { useStagingStore } from '@/stores/stagingStore';
import { useChangelistStore } from '@/stores/changelistStore';

interface ChangelistGroupProps {
  group: Changelist;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onFileSelect: (file: StagingFileChange) => void;
  selectedFilePath: string | null;
  onGroupAction?: (action: GroupAction, groupId: string) => void;
  onShowHistory?: (filePath: string) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export type GroupAction = 'edit' | 'delete' | 'archive' | 'commit';

interface GroupActionMenuProps {
  group: Changelist;
  onAction: (action: GroupAction) => void;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Context menu for group actions
 */
function GroupActionMenu({ group, onAction, isOpen, onToggle }: GroupActionMenuProps) {
  // System-generated groups (tracked/untracked) have limited actions
  const isSystemGroup = group.isSystemGenerated;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Group actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={onToggle} />

          {/* Menu dropdown */}
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {!isSystemGroup && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('edit');
                      onToggle();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Rename Group
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('archive');
                      onToggle();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Archive Group
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('commit');
                  onToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Commit Files...
              </button>
              {!isSystemGroup && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('delete');
                      onToggle();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete Group
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ChangelistGroup component displays a single changelist group with its files
 * Supports tracked, untracked, and custom groups with expand/collapse functionality
 */
export const ChangelistGroup = memo(function ChangelistGroup({
  group,
  isExpanded,
  onToggleExpanded,
  onFileSelect,
  selectedFilePath,
  onGroupAction,
  onShowHistory,
  isLoading = false,
  isDisabled = false,
}: ChangelistGroupProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [groupByFolder, setGroupByFolder] = useState(false); // Toggle state for grouping
  const fileListRef = useRef<HTMLDivElement>(null);

  // Setup droppable for this group
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.id}`,
    data: {
      type: 'group',
      groupId: group.id,
    },
  });

  // Get selection state and methods from store
  const selectedFilePaths = useChangelistStore((state) => state.selectedFilePaths);
  const selectAllFilesInGroup = useChangelistStore((state) => state.selectAllFilesInGroup);
  const deselectAllFilesInGroup = useChangelistStore((state) => state.deselectAllFilesInGroup);

  // Check if all files in this group are selected
  const allFilesSelected = useMemo(() => {
    if (group.items.length === 0) return false;
    return group.items.every((item) => selectedFilePaths.includes(item.path));
  }, [group.items, selectedFilePaths]);

  // Check if some (but not all) files are selected
  const someFilesSelected = useMemo(() => {
    if (group.items.length === 0) return false;
    const selectedCount = group.items.filter((item) => selectedFilePaths.includes(item.path)).length;
    return selectedCount > 0 && selectedCount < group.items.length;
  }, [group.items, selectedFilePaths]);

  // Visual styling based on group type
  const groupTypeStyles = useMemo(() => {
    switch (group.type) {
      case CHANGELIST_TYPE_TRACKED:
        return {
          badge: 'Tracked',
          badgeClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
          headerClass: 'bg-blue-50 dark:bg-blue-900/10',
        };
      case CHANGELIST_TYPE_UNTRACKED:
        return {
          badge: 'Untracked',
          badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          headerClass: 'bg-gray-50 dark:bg-gray-900/20',
        };
      case CHANGELIST_TYPE_CUSTOM:
        return {
          badge: 'Custom',
          badgeClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
          headerClass: 'bg-green-50 dark:bg-green-900/10',
        };
      default:
        return {
          badge: 'Unknown',
          badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          headerClass: 'bg-gray-50 dark:bg-gray-900/20',
        };
    }
  }, [group.type]);

  // Get original StagingFileChange objects from the staging store to preserve status
  const stagedFiles = useStagingStore((state) => state.stagedFiles);
  const unstagedFiles = useStagingStore((state) => state.unstagedFiles);
  const untrackedFiles = useStagingStore((state) => state.untrackedFiles);

  // Convert ChangelistItem[] to StagingFileChange[] by looking up original files
  const stagingFiles = useMemo(() => {
    // Create a map of all files from staging store for fast lookup
    const allStagingFiles = [...stagedFiles, ...unstagedFiles, ...untrackedFiles];
    const fileMap = new Map<string, StagingFileChange>();
    allStagingFiles.forEach((file) => {
      fileMap.set(file.path, file);
    });

    // Map changelist items to their original StagingFileChange objects
    return group.items.map((item: ChangelistItem): StagingFileChange => {
      const originalFile = fileMap.get(item.path);
      if (originalFile) {
        // Use the original file to preserve status and other metadata
        return originalFile;
      }
      // Fallback for missing files (shouldn't happen but handle gracefully)
      return {
        path: item.path,
        oldPath: null,
        status: item.isMissingFromWorkingTree ? FileStatus.Deleted : FileStatus.Modified,
        additions: 0,
        deletions: 0,
        isBinary: false,
        staged: false,
      };
    });
  }, [group.items, stagedFiles, unstagedFiles, untrackedFiles]);

  // Find selected file from FileTree
  const selectedFile = useMemo(() => {
    return stagingFiles.find((f) => f.path === selectedFilePath) || null;
  }, [stagingFiles, selectedFilePath]);

  const fileCount = group.items.length;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  // Use virtualization for file lists with more than 100 items
  const shouldVirtualizeFiles = fileCount > 100;

  const fileVirtualizer = useVirtualizer({
    count: stagingFiles.length,
    getScrollElement: () => fileListRef.current,
    estimateSize: () => 32, // Estimated height of each file item
    enabled: shouldVirtualizeFiles && isExpanded,
    overscan: 10,
  });

  const handleAction = (action: GroupAction) => {
    if (onGroupAction) {
      onGroupAction(action, group.id);
    }
  };

  const handleToggleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allFilesSelected) {
      deselectAllFilesInGroup(group.id, group.items);
    } else {
      selectAllFilesInGroup(group.id, group.items);
    }
  };

  // Helper to render a single file item
  const renderFileItem = (file: StagingFileChange) => {
    const isSelected = file.path === selectedFilePath;
    const statusColor = {
      [FileStatus.Modified]: 'text-blue-600 dark:text-blue-400',
      [FileStatus.Added]: 'text-green-600 dark:text-green-400',
      [FileStatus.Deleted]: 'text-red-600 dark:text-red-400',
      [FileStatus.Renamed]: 'text-purple-600 dark:text-purple-400',
      [FileStatus.Copied]: 'text-purple-600 dark:text-purple-400',
      [FileStatus.Untracked]: 'text-gray-600 dark:text-gray-400',
    }[file.status];

    const statusLabel = {
      [FileStatus.Modified]: 'M',
      [FileStatus.Added]: 'A',
      [FileStatus.Deleted]: 'D',
      [FileStatus.Renamed]: 'R',
      [FileStatus.Copied]: 'C',
      [FileStatus.Untracked]: 'U',
    }[file.status];

    const fileNode = (
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
        }`}
        onClick={() => onFileSelect(file)}
      >
        <File className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-sm truncate text-gray-900 dark:text-gray-100">
          {file.path}
        </span>
        <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>
    );

    return onShowHistory && group.id ? (
      <FileContextMenu
        filePath={file.path}
        currentGroupId={group.id}
        onHistoryClick={() => onShowHistory(file.path)}
      >
        {fileNode}
      </FileContextMenu>
    ) : (
      fileNode
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`changelist-group border rounded-lg overflow-hidden mb-2 transition-colors ${
        isOver
          ? 'border-blue-500 dark:border-blue-400 border-2 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Group Header */}
      <div
        className={`${groupTypeStyles.headerClass} px-4 py-3 cursor-pointer select-none transition-colors hover:brightness-95 dark:hover:brightness-110 ${
          isDisabled ? 'opacity-50 pointer-events-none' : ''
        }`}
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          <ChevronIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 transition-transform" />

          {/* Group Icon */}
          <FolderOpen className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />

          {/* Group Name */}
          <span className="flex-1 font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
            {group.name}
          </span>

          {/* File Count */}
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </span>

          {/* Type Badge */}
          <span className={`px-2 py-1 text-xs font-medium rounded ${groupTypeStyles.badgeClass}`}>
            {groupTypeStyles.badge}
          </span>

          {/* Group by Folder Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGroupByFolder(!groupByFolder);
            }}
            className={`p-1.5 rounded transition-colors ${
              groupByFolder
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={groupByFolder ? 'Disable folder grouping' : 'Enable folder grouping'}
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* Select All/Deselect All Button */}
          <button
            onClick={handleToggleSelectAll}
            className={`p-1.5 rounded transition-colors ${
              allFilesSelected || someFilesSelected
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={allFilesSelected ? 'Deselect all files in group' : 'Select all files in group'}
          >
            {allFilesSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          {/* Loading Spinner */}
          {isLoading && (
            <Loader2 className="w-4 h-4 text-gray-600 dark:text-gray-400 animate-spin" />
          )}

          {/* Action Menu */}
          {onGroupAction && (
            <div onClick={(e) => e.stopPropagation()}>
              <GroupActionMenu
                group={group}
                onAction={handleAction}
                isOpen={isMenuOpen}
                onToggle={() => setIsMenuOpen(!isMenuOpen)}
              />
            </div>
          )}
        </div>

        {/* Optional Description */}
        {group.description && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{group.description}</div>
        )}
      </div>

      {/* Group Content - Files */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {fileCount === 0 ? (
            // Empty State
            <div className="py-4">
              <EmptyState
                icon={<FolderOpen className="w-12 h-12" />}
                title="No Files in Group"
                description="Add files by dragging them here or using the context menu"
              />
            </div>
          ) : shouldVirtualizeFiles ? (
            // Virtualized File List for large datasets (>100 files)
            <div ref={fileListRef} className="bg-white dark:bg-gray-900 max-h-96 overflow-auto">
              <div
                style={{
                  height: `${fileVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {fileVirtualizer.getVirtualItems().map((virtualItem) => {
                  const file = stagingFiles[virtualItem.index];
                  return (
                    <div
                      key={file.path}
                      data-index={virtualItem.index}
                      ref={fileVirtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {renderFileItem(file)}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // File Tree for smaller datasets (<= 100 files)
            <div className="bg-white dark:bg-gray-900">
              <FileTree
                files={stagingFiles}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                groupId={group.id}
                onShowHistory={onShowHistory}
                groupByFolder={groupByFolder}
                showCheckboxes={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
