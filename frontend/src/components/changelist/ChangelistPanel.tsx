import { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { FolderOpen } from 'lucide-react';
import { ChangelistGroup, type GroupAction } from './ChangelistGroup';
import { GroupActionsToolbar } from './GroupActionsToolbar';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useStagingStore } from '@/stores/stagingStore';
import { useTrackedGroup, useUntrackedGroup } from '@/stores/selectors/changelistSelectors';
import { stageFile } from '@/api/staging';
import type { StagingFileChange } from '@/types/git';
import type { Changelist } from '@/types/changelist';
import {
  CHANGELIST_TYPE_TRACKED,
  CHANGELIST_TYPE_UNTRACKED,
  CHANGELIST_TYPE_CUSTOM,
} from '@/types/changelist';
import toast from 'react-hot-toast';

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
  const moveFilesBetweenGroups = useChangelistStore((state) => state.moveFilesBetweenGroups);
  const addFilesToGroup = useChangelistStore((state) => state.addFilesToGroup);
  const removeFilesFromGroup = useChangelistStore((state) => state.removeFilesFromGroup);
  const isLoading = useChangelistStore((state) => state.isLoading);
  const isReconciling = useChangelistStore((state) => state.isReconciling);
  const operationInProgress = useChangelistStore((state) => state.operationInProgress);

  // Get repository path
  const repositoryPath = useRepositoryStore((state) => state.currentRepository?.path);

  // Get staging store methods
  const loadChanges = useStagingStore((state) => state.loadChanges);

  // Get derived groups from selectors
  const trackedGroup = useTrackedGroup();
  const untrackedGroup = useUntrackedGroup();

  // Combine all groups in the correct order to determine initial expanded state
  const initialGroups = useMemo(() => {
    const groups: Changelist[] = [];
    if (trackedGroup) groups.push(trackedGroup);
    if (untrackedGroup) groups.push(untrackedGroup);
    const sortedCustomGroups = [...customGroups].sort((a, b) => a.orderIndex - b.orderIndex);
    groups.push(...sortedCustomGroups);
    return groups;
  }, [trackedGroup, untrackedGroup, customGroups]);

  // Manage expanded state for each group
  // Default: expand groups that have files (non-empty), collapse empty groups
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => {
    const expandedIds = new Set<string>();
    initialGroups.forEach((group) => {
      if (group.items.length > 0) {
        expandedIds.add(group.id);
      }
    });
    return expandedIds;
  });

  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

  // Configure drag sensor with activation constraints
  // This prevents drag from starting immediately, allowing normal clicks and right-clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Use the same groups for rendering
  const allGroups = initialGroups;

  // Use virtualization for lists with more than 50 groups
  const shouldVirtualize = allGroups.length > 50;

  // Estimate size based on whether groups are expanded
  // Collapsed group: ~60px, Expanded group: dynamic based on file count
  const estimateGroupSize = useCallback(
    (index: number) => {
      const group = allGroups[index];
      if (!group) return 60;

      const isExpanded = expandedGroupIds.has(group.id);
      if (!isExpanded) return 60; // Collapsed group height

      // Expanded group: header (60px) + files (40px each) + padding
      const fileCount = group.items.length;
      return 60 + fileCount * 40 + 16;
    },
    [allGroups, expandedGroupIds]
  );

  const virtualizer = useVirtualizer({
    count: allGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateGroupSize,
    enabled: shouldVirtualize,
    overscan: 3,
  });

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

  // Handle drag end - move file(s) between groups
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !repositoryPath) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Ensure we're dragging a file onto a group
      if (activeData?.type !== 'file' || overData?.type !== 'group') return;

      // Support both single file (filePath) and multiple files (filePaths)
      const filePaths = activeData.filePaths || [activeData.filePath];
      const sourceGroupId = activeData.groupId;
      const targetGroupId = overData.groupId;

      // Don't do anything if dropped on the same group
      if (sourceGroupId === targetGroupId) return;

      // Find source and target groups
      const sourceGroup = allGroups.find((g) => g.id === sourceGroupId);
      const targetGroup = allGroups.find((g) => g.id === targetGroupId);

      if (!sourceGroup || !targetGroup) return;

      // VALIDATION: Prevent invalid moves
      // 1. Cannot move any files to untracked group (untracked is for files not tracked by Git)
      if (targetGroup.type === CHANGELIST_TYPE_UNTRACKED) {
        toast.error('Cannot move files to untracked group.');
        return;
      }

      const fileCount = filePaths.length;
      const fileText = fileCount === 1 ? `"${filePaths[0]}"` : `${fileCount} file(s)`;

      try {
        // Handle moves involving system groups (tracked/untracked)
        if (
          sourceGroup.type === CHANGELIST_TYPE_TRACKED ||
          targetGroup.type === CHANGELIST_TYPE_TRACKED
        ) {
          // Moving from tracked to custom: keep file staged, just add to custom group
          // Don't unstage! If we unstage a file that was originally untracked, it becomes untracked again
          if (
            sourceGroup.type === CHANGELIST_TYPE_TRACKED &&
            targetGroup.type === CHANGELIST_TYPE_CUSTOM
          ) {
            await addFilesToGroup(repositoryPath, targetGroupId, filePaths);
            toast.success(`Moved ${fileText} to "${targetGroup.name}"`);
          }
          // Moving from custom/untracked to tracked: stage the file(s)
          else if (targetGroup.type === CHANGELIST_TYPE_TRACKED) {
            if (sourceGroup.type === CHANGELIST_TYPE_CUSTOM) {
              await removeFilesFromGroup(repositoryPath, sourceGroupId, filePaths);
            }
            // Stage all files
            for (const filePath of filePaths) {
              await stageFile(filePath);
            }
            await loadChanges();
            toast.success(`Staged ${fileText}`);
          }
        }
        // Handle moves from untracked to custom group
        else if (
          sourceGroup.type === CHANGELIST_TYPE_UNTRACKED &&
          targetGroup.type === CHANGELIST_TYPE_CUSTOM
        ) {
          // Moving from untracked to custom: stage the file(s) first, then add to group
          for (const filePath of filePaths) {
            await stageFile(filePath);
          }
          await loadChanges(); // Refresh Git status first
          await addFilesToGroup(repositoryPath, targetGroupId, filePaths);
          toast.success(`Moved ${fileText} to "${targetGroup.name}"`);
        }
        // Both are custom groups: use moveFilesBetweenGroups
        else if (
          sourceGroup.type === CHANGELIST_TYPE_CUSTOM &&
          targetGroup.type === CHANGELIST_TYPE_CUSTOM
        ) {
          await moveFilesBetweenGroups(repositoryPath, sourceGroupId, targetGroupId, filePaths);
          toast.success(`Moved ${fileText} to "${targetGroup.name}"`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to move file(s)';
        toast.error(message);
      }
    },
    [
      repositoryPath,
      allGroups,
      moveFilesBetweenGroups,
      addFilesToGroup,
      removeFilesFromGroup,
      loadChanges,
    ]
  );

  // Empty state when no changes
  if (allGroups.length === 0) {
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
        {/* Toolbar */}
        <GroupActionsToolbar />

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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
        {/* Toolbar */}
        <GroupActionsToolbar />

        {/* Reconciliation indicator */}
        {isReconciling && (
          <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 px-4 py-2 flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-blue-700 dark:text-blue-200">Reconciling changes...</span>
          </div>
        )}

        {/* Groups List */}
        <div ref={parentRef} className="flex-1 overflow-y-auto p-4 relative">
          {/* Show loading spinner for initial load */}
          {isLoading && allGroups.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Spinner text="Loading changelists..." />
            </div>
          ) : shouldVirtualize ? (
            // Virtualized list for large datasets
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const group = allGroups[virtualItem.index];
                return (
                  <div
                    key={group.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="pb-2"
                  >
                    <ChangelistGroup
                      group={group}
                      isExpanded={expandedGroupIds.has(group.id)}
                      onToggleExpanded={() => toggleGroupExpanded(group.id)}
                      onFileSelect={onFileSelect}
                      selectedFilePath={selectedFilePath}
                      onGroupAction={handleGroupAction}
                      onShowHistory={onShowHistory}
                      isDisabled={!!operationInProgress}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Regular list for smaller datasets
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
    </DndContext>
  );
}
