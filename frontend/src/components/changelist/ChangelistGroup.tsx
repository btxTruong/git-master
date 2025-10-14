import { memo, useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, MoreVertical, Loader2 } from 'lucide-react';
import type { Changelist, ChangelistItem } from '@/types/changelist';
import {
  CHANGELIST_TYPE_CUSTOM,
  CHANGELIST_TYPE_TRACKED,
  CHANGELIST_TYPE_UNTRACKED,
} from '@/types/changelist';
import { FileTree } from '@/components/staging/FileTree';
import { EmptyState } from '@/components/common/EmptyState';
import type { StagingFileChange } from '@/types/git';
import { FileStatus } from '@/types/git';

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

  // Convert ChangelistItem[] to StagingFileChange[] for FileTree
  const stagingFiles = useMemo(() => {
    return group.items.map(
      (item: ChangelistItem): StagingFileChange => ({
        path: item.path,
        oldPath: null,
        status: item.isMissingFromWorkingTree ? FileStatus.Deleted : FileStatus.Modified,
        additions: 0,
        deletions: 0,
        isBinary: false,
        staged: false,
      })
    );
  }, [group.items]);

  // Find selected file from FileTree
  const selectedFile = useMemo(() => {
    return stagingFiles.find((f) => f.path === selectedFilePath) || null;
  }, [stagingFiles, selectedFilePath]);

  const fileCount = group.items.length;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  const handleAction = (action: GroupAction) => {
    if (onGroupAction) {
      onGroupAction(action, group.id);
    }
  };

  return (
    <div className="changelist-group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-2">
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
          ) : (
            // File Tree
            <div className="bg-white dark:bg-gray-900">
              <FileTree
                files={stagingFiles}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                groupId={group.id}
                onShowHistory={onShowHistory}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
