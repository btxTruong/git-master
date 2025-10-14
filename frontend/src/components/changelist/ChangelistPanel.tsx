import { useState, useMemo, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { ChangelistGroup, type GroupAction } from './ChangelistGroup';
import { GroupActionsToolbar } from './GroupActionsToolbar';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useTrackedGroup, useUntrackedGroup } from '@/stores/selectors/changelistSelectors';
import type { StagingFileChange } from '@/types/git';
import type { Changelist } from '@/types/changelist';

interface ChangelistPanelProps {
  onFileSelect: (file: StagingFileChange) => void;
  selectedFilePath: string | null;
  onShowHistory?: (filePath: string) => void;
  className?: string;
}

/**
 * Main changelist panel that displays all groups (tracked, untracked, custom)
 * and coordinates group and file interactions.
 *
 * Display order:
 * 1. Tracked group (if exists)
 * 2. Untracked group (if exists)
 * 3. Custom groups (sorted by orderIndex)
 */
export function ChangelistPanel({
  onFileSelect,
  selectedFilePath,
  onShowHistory,
  className = '',
}: ChangelistPanelProps) {
  // Get custom groups from store
  const customGroups = useChangelistStore((state) => state.groups);
  const deleteGroup = useChangelistStore((state) => state.deleteGroup);
  const renameGroup = useChangelistStore((state) => state.renameGroup);
  const isLoading = useChangelistStore((state) => state.isLoading);
  const isReconciling = useChangelistStore((state) => state.isReconciling);
  const operationInProgress = useChangelistStore((state) => state.operationInProgress);

  // Get repository path
  const repositoryPath = useRepositoryStore((state) => state.currentRepository?.path);

  // Get derived groups from selectors
  const trackedGroup = useTrackedGroup();
  const untrackedGroup = useUntrackedGroup();

  // Manage expanded state for each group
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  // Combine all groups in the correct order
  const allGroups = useMemo(() => {
    const groups: Changelist[] = [];

    // Add tracked group first
    if (trackedGroup) {
      groups.push(trackedGroup);
    }

    // Add untracked group second
    if (untrackedGroup) {
      groups.push(untrackedGroup);
    }

    // Add custom groups sorted by orderIndex
    const sortedCustomGroups = [...customGroups].sort((a, b) => a.orderIndex - b.orderIndex);
    groups.push(...sortedCustomGroups);

    return groups;
  }, [trackedGroup, untrackedGroup, customGroups]);

  // Toggle group expansion
  const toggleGroupExpanded = useCallback((groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Expand all groups
  const expandAll = useCallback(() => {
    const allGroupIds = new Set(allGroups.map((g) => g.id));
    setExpandedGroupIds(allGroupIds);
  }, [allGroups]);

  // Collapse all groups
  const collapseAll = useCallback(() => {
    setExpandedGroupIds(new Set());
  }, []);

  // Check if all groups are expanded
  const allExpanded = useMemo(() => {
    if (allGroups.length === 0) return false;
    return allGroups.every((g) => expandedGroupIds.has(g.id));
  }, [allGroups, expandedGroupIds]);

  // Handle group actions
  const handleGroupAction = useCallback(
    async (action: GroupAction, groupId: string) => {
      if (!repositoryPath) return;

      switch (action) {
        case 'edit': {
          // Show rename dialog
          const group = allGroups.find((g) => g.id === groupId);
          if (!group) return;

          const newName = window.prompt('Enter new group name:', group.name);
          if (newName && newName.trim() !== group.name) {
            try {
              await renameGroup(repositoryPath, groupId, newName.trim());
            } catch {
              // Error already handled by store
            }
          }
          break;
        }

        case 'delete': {
          // Confirm deletion
          const group = allGroups.find((g) => g.id === groupId);
          if (!group) return;

          const confirmed = window.confirm(
            `Are you sure you want to delete the group "${group.name}"?\n\nFiles will not be deleted from disk, only removed from the group.`
          );

          if (confirmed) {
            try {
              await deleteGroup(repositoryPath, groupId);
            } catch {
              // Error already handled by store
            }
          }
          break;
        }

        case 'archive': {
          // TODO: Implement archive functionality in task 028+
          console.log('Archive action not yet implemented');
          break;
        }

        case 'commit': {
          // TODO: Implement commit from group in task 029
          console.log('Commit action not yet implemented');
          break;
        }
      }
    },
    [repositoryPath, allGroups, deleteGroup, renameGroup]
  );

  // Handle creating a new group
  const handleCreateGroup = useCallback(() => {
    if (!repositoryPath) return;

    const groupName = window.prompt('Enter group name:');
    if (groupName && groupName.trim()) {
      useChangelistStore.getState().createGroup(repositoryPath, groupName.trim());
    }
  }, [repositoryPath]);

  // Empty state when no changes
  if (allGroups.length === 0) {
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
        {/* Toolbar */}
        <GroupActionsToolbar
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          allExpanded={allExpanded}
        />

        {/* Empty state */}
        <div className="flex-1">
          <EmptyState
            icon={<FolderOpen className="w-16 h-16" />}
            title="No Changes"
            description="Your working directory is clean. Make some changes to files or create a custom group to organize your work."
            action={{
              label: 'Create Group',
              onClick: handleCreateGroup,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Toolbar */}
      <GroupActionsToolbar
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        allExpanded={allExpanded}
      />

      {/* Reconciliation indicator */}
      {isReconciling && (
        <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 px-4 py-2 flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-sm text-blue-700 dark:text-blue-200">Reconciling changes...</span>
        </div>
      )}

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {/* Show loading spinner for initial load */}
        {isLoading && allGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Spinner text="Loading changelists..." />
          </div>
        ) : (
          <>
            {allGroups.map((group) => (
              <ChangelistGroup
                key={group.id}
                group={group}
                isExpanded={expandedGroupIds.has(group.id)}
                onToggleExpanded={() => toggleGroupExpanded(group.id)}
                onFileSelect={onFileSelect}
                selectedFilePath={selectedFilePath}
                onGroupAction={handleGroupAction}
                onShowHistory={onShowHistory}
                isDisabled={!!operationInProgress}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
