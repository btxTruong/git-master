import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { Changelist, ChangelistItem } from '@/types/changelist';
import {
  createChangelistGroup,
  renameChangelistGroup,
  deleteChangelistGroup,
  addPathsToChangelistGroup,
  removePathsFromChangelistGroup,
  movePathsBetweenChangelistGroups,
  getAllChangelistGroups,
  reconcileChangelistsWithGitStatus,
  removeMissingFilesFromAllGroups,
} from '@/api/changelist';
import { CHANGELIST_TYPE_CUSTOM } from '@/types/changelist';
import { getErrorDetails, logError } from '@/utils/errorHandling';

interface ChangelistState {
  // Core state
  groups: Changelist[];
  pathToGroupIds: Map<string, string[]>;
  selectedGroupId: string | null;
  selectedFilePaths: string[];
  expandedGroupIds: string[];
  isLoading: boolean;
  error: string | null;

  // Granular loading states
  isReconciling: boolean;
  operationInProgress: string | null; // Track which operation is running

  // CRUD Actions
  loadAllChangelistGroups: (repositoryPath: string) => Promise<void>;
  createGroup: (repositoryPath: string, groupName: string) => Promise<void>;
  renameGroup: (repositoryPath: string, groupId: string, newName: string) => Promise<void>;
  deleteGroup: (repositoryPath: string, groupId: string) => Promise<void>;

  // File management actions
  addFilesToGroup: (repositoryPath: string, groupId: string, filePaths: string[]) => Promise<void>;
  removeFilesFromGroup: (
    repositoryPath: string,
    groupId: string,
    filePaths: string[]
  ) => Promise<void>;
  moveFilesBetweenGroups: (
    repositoryPath: string,
    sourceGroupId: string,
    targetGroupId: string,
    filePaths: string[]
  ) => Promise<void>;

  // Reconciliation actions
  reconcileWithGitStatus: (repositoryPath: string, gitStatusOutput: string) => Promise<void>;
  removeMissingFiles: (repositoryPath: string) => Promise<void>;

  // UI state actions
  setSelectedGroup: (groupId: string | null) => void;
  setSelectedFiles: (filePaths: string[]) => void;
  toggleFileSelection: (filePath: string) => void;
  selectAllFilesInGroup: (groupId: string, groupItems?: ChangelistItem[]) => void;
  deselectAllFilesInGroup: (groupId: string, groupItems?: ChangelistItem[]) => void;
  clearSelectedFiles: () => void;
  toggleGroupExpanded: (groupId: string) => void;
  reset: () => void;

  // Internal helpers
  updatePathIndex: () => void;
}

export const useChangelistStore = create<ChangelistState>()((set, get) => ({
  // Initial state
  groups: [],
  pathToGroupIds: new Map(),
  selectedGroupId: null,
  selectedFilePaths: [],
  expandedGroupIds: [],
  isLoading: false,
  error: null,
  isReconciling: false,
  operationInProgress: null,

  // Load all changelist groups
  loadAllChangelistGroups: async (repositoryPath: string) => {
    set({ isLoading: true, error: null });

    try {
      const groups = await getAllChangelistGroups(repositoryPath);

      // Filter to only custom groups as per technical requirements
      const customGroups = groups.filter((g) => g.type === CHANGELIST_TYPE_CUSTOM);

      set({
        groups: customGroups,
        isLoading: false,
      });

      // Update the path-to-group index
      get().updatePathIndex();
    } catch (error) {
      logError(error, 'loadAllChangelistGroups');
      const errorDetails = getErrorDetails(error);
      set({ error: errorDetails.message, isLoading: false });
      toast.error(errorDetails.message);
      if (errorDetails.suggestion) {
        toast(errorDetails.suggestion, { icon: '💡', duration: 4000 });
      }
    }
  },

  // Create a new group
  createGroup: async (repositoryPath: string, groupName: string) => {
    const previousGroups = get().groups;
    set({ operationInProgress: 'create-group' });

    try {
      // Optimistically add the new group to state
      const newGroup = await createChangelistGroup(repositoryPath, groupName);

      set({
        groups: [...previousGroups, newGroup],
        operationInProgress: null,
      });

      get().updatePathIndex();
      toast.success(`Created group "${groupName}"`);
    } catch (error) {
      // Rollback on error
      set({ groups: previousGroups, operationInProgress: null });

      logError(error, 'createGroup');
      const errorDetails = getErrorDetails(error);
      toast.error(errorDetails.message);
      if (errorDetails.suggestion) {
        toast(errorDetails.suggestion, { icon: '💡', duration: 4000 });
      }
      throw error;
    }
  },

  // Rename an existing group
  renameGroup: async (repositoryPath: string, groupId: string, newName: string) => {
    const previousGroups = get().groups;
    set({ operationInProgress: 'rename-group' });

    try {
      // Optimistically update the group name
      const updatedGroups = previousGroups.map((g) =>
        g.id === groupId ? { ...g, name: newName, updatedAt: new Date().toISOString() } : g
      );

      set({ groups: updatedGroups });

      await renameChangelistGroup(repositoryPath, groupId, newName);

      set({ operationInProgress: null });
      toast.success(`Renamed group to "${newName}"`);
    } catch (error) {
      // Rollback on error
      set({ groups: previousGroups, operationInProgress: null });

      const message = error instanceof Error ? error.message : 'Failed to rename group';
      toast.error(message);
      throw error;
    }
  },

  // Delete a group
  deleteGroup: async (repositoryPath: string, groupId: string) => {
    const previousGroups = get().groups;
    const groupToDelete = previousGroups.find((g) => g.id === groupId);

    if (!groupToDelete) {
      toast.error('Group not found');
      return;
    }

    set({ operationInProgress: 'delete-group' });

    try {
      // Optimistically remove the group
      const updatedGroups = previousGroups.filter((g) => g.id !== groupId);

      set({
        groups: updatedGroups,
        selectedGroupId: get().selectedGroupId === groupId ? null : get().selectedGroupId,
      });

      get().updatePathIndex();

      await deleteChangelistGroup(repositoryPath, groupId);

      set({ operationInProgress: null });
      toast.success(`Deleted group "${groupToDelete.name}"`);
    } catch (error) {
      // Rollback on error
      set({ groups: previousGroups, operationInProgress: null });
      get().updatePathIndex();

      const message = error instanceof Error ? error.message : 'Failed to delete group';
      toast.error(message);
      throw error;
    }
  },

  // Add files to a group
  addFilesToGroup: async (repositoryPath: string, groupId: string, filePaths: string[]) => {
    const previousGroups = get().groups;

    try {
      // Optimistically add files to the group
      const updatedGroups = previousGroups.map((g) => {
        if (g.id !== groupId) return g;

        const now = new Date().toISOString();
        const existingPaths = new Set(g.items.map((item) => item.path));

        const newItems: ChangelistItem[] = filePaths
          .filter((path) => !existingPaths.has(path))
          .map((path) => ({
            path,
            addedAt: now,
            lastModifiedAt: now,
          }));

        return {
          ...g,
          items: [...g.items, ...newItems],
          updatedAt: now,
        };
      });

      set({ groups: updatedGroups });
      get().updatePathIndex();

      await addPathsToChangelistGroup(repositoryPath, groupId, filePaths);

      toast.success(`Added ${filePaths.length} file(s) to group`);
    } catch (error) {
      // Rollback on error
      set({ groups: previousGroups });
      get().updatePathIndex();

      const message = error instanceof Error ? error.message : 'Failed to add files to group';
      toast.error(message);
      throw error;
    }
  },

  // Remove files from a group
  removeFilesFromGroup: async (repositoryPath: string, groupId: string, filePaths: string[]) => {
    const previousGroups = get().groups;

    try {
      // Optimistically remove files from the group
      const filePathsSet = new Set(filePaths);
      const updatedGroups = previousGroups.map((g) => {
        if (g.id !== groupId) return g;

        return {
          ...g,
          items: g.items.filter((item) => !filePathsSet.has(item.path)),
          updatedAt: new Date().toISOString(),
        };
      });

      set({ groups: updatedGroups });
      get().updatePathIndex();

      await removePathsFromChangelistGroup(repositoryPath, groupId, filePaths);

      toast.success(`Removed ${filePaths.length} file(s) from group`);
    } catch (error) {
      // Rollback on error
      set({ groups: previousGroups });
      get().updatePathIndex();

      const message = error instanceof Error ? error.message : 'Failed to remove files from group';
      toast.error(message);
      throw error;
    }
  },

  // Move files between groups
  moveFilesBetweenGroups: async (
    repositoryPath: string,
    sourceGroupId: string,
    targetGroupId: string,
    filePaths: string[]
  ) => {
    const previousGroups = get().groups;

    try {
      // Optimistically move files between groups
      const now = new Date().toISOString();
      const filePathsSet = new Set(filePaths);

      const updatedGroups = previousGroups.map((g) => {
        if (g.id === sourceGroupId) {
          // Remove files from source group
          return {
            ...g,
            items: g.items.filter((item) => !filePathsSet.has(item.path)),
            updatedAt: now,
          };
        } else if (g.id === targetGroupId) {
          // Add files to target group
          const existingPaths = new Set(g.items.map((item) => item.path));

          const newItems: ChangelistItem[] = filePaths
            .filter((path) => !existingPaths.has(path))
            .map((path) => ({
              path,
              addedAt: now,
              lastModifiedAt: now,
            }));

          return {
            ...g,
            items: [...g.items, ...newItems],
            updatedAt: now,
          };
        }
        return g;
      });

      set({ groups: updatedGroups });
      get().updatePathIndex();

      await movePathsBetweenChangelistGroups(
        repositoryPath,
        sourceGroupId,
        targetGroupId,
        filePaths
      );

      toast.success(`Moved ${filePaths.length} file(s) between groups`);
    } catch (error) {
      // Rollback on error
      set({ groups: previousGroups });
      get().updatePathIndex();

      const message =
        error instanceof Error ? error.message : 'Failed to move files between groups';
      toast.error(message);
      throw error;
    }
  },

  // Reconcile with Git status
  reconcileWithGitStatus: async (repositoryPath: string, gitStatusOutput: string) => {
    set({ isReconciling: true });

    try {
      await reconcileChangelistsWithGitStatus(repositoryPath, gitStatusOutput);

      // Reload groups after reconciliation
      await get().loadAllChangelistGroups(repositoryPath);

      set({ isReconciling: false });
      // Silent reconciliation - no toast unless error (per acceptance criteria)
    } catch (error) {
      set({ isReconciling: false });
      const message =
        error instanceof Error ? error.message : 'Failed to reconcile with Git status';
      toast.error(message);
      throw error;
    }
  },

  // Remove missing files
  removeMissingFiles: async (repositoryPath: string) => {
    try {
      const removedCount = await removeMissingFilesFromAllGroups(repositoryPath);

      // Reload groups after removal
      await get().loadAllChangelistGroups(repositoryPath);

      if (removedCount > 0) {
        toast.success(`Removed ${removedCount} missing file(s)`);
      } else {
        toast.success('No missing files found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove missing files';
      toast.error(message);
      throw error;
    }
  },

  // UI state actions
  setSelectedGroup: (groupId: string | null) => set({ selectedGroupId: groupId }),

  setSelectedFiles: (filePaths: string[]) => set({ selectedFilePaths: filePaths }),

  toggleFileSelection: (filePath: string) => {
    const selectedFilePaths = get().selectedFilePaths;
    const isSelected = selectedFilePaths.includes(filePath);

    set({
      selectedFilePaths: isSelected
        ? selectedFilePaths.filter((path) => path !== filePath)
        : [...selectedFilePaths, filePath],
    });
  },

  selectAllFilesInGroup: (groupId: string, groupItems?: ChangelistItem[]) => {
    const { groups, selectedFilePaths } = get();

    // If groupItems are provided directly (for derived groups), use them
    // Otherwise find the group in the store (for custom groups)
    let filePaths: string[];

    if (groupItems) {
      filePaths = groupItems.map((item) => item.path);
    } else {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      filePaths = group.items.map((item) => item.path);
    }

    // Add group files to selection (avoid duplicates)
    const newSelection = Array.from(new Set([...selectedFilePaths, ...filePaths]));

    set({ selectedFilePaths: newSelection });
  },

  deselectAllFilesInGroup: (groupId: string, groupItems?: ChangelistItem[]) => {
    const { groups, selectedFilePaths } = get();

    // If groupItems are provided directly (for derived groups), use them
    // Otherwise find the group in the store (for custom groups)
    let filePaths: Set<string>;

    if (groupItems) {
      filePaths = new Set(groupItems.map((item) => item.path));
    } else {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      filePaths = new Set(group.items.map((item) => item.path));
    }

    // Remove group files from selection
    const newSelection = selectedFilePaths.filter((path) => !filePaths.has(path));

    set({ selectedFilePaths: newSelection });
  },

  clearSelectedFiles: () => set({ selectedFilePaths: [] }),

  toggleGroupExpanded: (groupId: string) => {
    const expandedGroupIds = get().expandedGroupIds;
    const isExpanded = expandedGroupIds.includes(groupId);

    set({
      expandedGroupIds: isExpanded
        ? expandedGroupIds.filter((id) => id !== groupId)
        : [...expandedGroupIds, groupId],
    });
  },

  reset: () =>
    set({
      groups: [],
      pathToGroupIds: new Map(),
      selectedGroupId: null,
      selectedFilePaths: [],
      expandedGroupIds: [],
      isLoading: false,
      error: null,
      isReconciling: false,
      operationInProgress: null,
    }),

  // Internal helper to maintain path-to-group reverse index
  updatePathIndex: () => {
    const { groups } = get();
    const pathToGroupIds = new Map<string, string[]>();

    for (const group of groups) {
      for (const item of group.items) {
        const existingGroupIds = pathToGroupIds.get(item.path) || [];
        pathToGroupIds.set(item.path, [...existingGroupIds, group.id]);
      }
    }

    set({ pathToGroupIds });
  },
}));
