import type { Changelist, ChangelistItem } from '@/types/changelist';
import { CHANGELIST_TYPE_TRACKED, CHANGELIST_TYPE_UNTRACKED } from '@/types/changelist';
import type { StagingFileChange } from '@/types/git';
import { useStagingStore } from '@/stores/stagingStore';

/**
 * Converts a StagingFileChange to a ChangelistItem.
 *
 * @param file - The staging file change to convert
 * @returns A changelist item
 */
function mapFileToChangelistItem(file: StagingFileChange): ChangelistItem {
  const now = new Date().toISOString();

  return {
    path: file.path,
    trackedSnapshotHash: undefined, // Not available from staging
    notes: undefined,
    isMissingFromWorkingTree: false,
    addedAt: now,
    lastModifiedAt: now,
  };
}

/**
 * Selector that derives a "tracked" group from staged and unstaged files.
 * This represents all files that are currently being tracked by Git.
 *
 * @returns A Changelist representing tracked files, or null if no files
 *
 * @example
 * const TrackedGroup = () => {
 *   const trackedGroup = useChangelistStore(selectTrackedGroup);
 *   return <GroupList group={trackedGroup} />;
 * };
 */
export function selectTrackedGroup(): Changelist | null {
  const stagedFiles = useStagingStore.getState().stagedFiles;
  const unstagedFiles = useStagingStore.getState().unstagedFiles;

  // Combine staged and unstaged files (tracked files)
  const trackedFiles = [...stagedFiles, ...unstagedFiles];

  if (trackedFiles.length === 0) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: '__tracked__',
    name: 'Tracked Changes',
    type: CHANGELIST_TYPE_TRACKED,
    createdAt: now,
    updatedAt: now,
    items: trackedFiles.map(mapFileToChangelistItem),
    isSystemGenerated: true,
    orderIndex: -2, // Higher priority than untracked
    colorHexCode: '#3b82f6', // Blue
    description: 'Files tracked by Git with changes',
  };
}

/**
 * Selector that derives an "untracked" group from untracked files.
 * This represents all files that are not currently tracked by Git.
 *
 * @returns A Changelist representing untracked files, or null if no files
 *
 * @example
 * const UntrackedGroup = () => {
 *   const untrackedGroup = useChangelistStore(selectUntrackedGroup);
 *   return <GroupList group={untrackedGroup} />;
 * };
 */
export function selectUntrackedGroup(): Changelist | null {
  const untrackedFiles = useStagingStore.getState().untrackedFiles;

  if (untrackedFiles.length === 0) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: '__untracked__',
    name: 'Untracked Files',
    type: CHANGELIST_TYPE_UNTRACKED,
    createdAt: now,
    updatedAt: now,
    items: untrackedFiles.map(mapFileToChangelistItem),
    isSystemGenerated: true,
    orderIndex: -1, // Lower priority than tracked
    colorHexCode: '#6b7280', // Gray
    description: 'Files not tracked by Git',
  };
}

/**
 * Selector that returns all groups including both custom and derived groups.
 * This combines custom groups from changelistStore with derived tracked/untracked groups.
 *
 * @param customGroups - Array of custom changelist groups
 * @returns Array of all changelists (custom + derived)
 *
 * @example
 * const AllGroups = () => {
 *   const customGroups = useChangelistStore((state) => state.groups);
 *   const allGroups = selectAllGroups(customGroups);
 *   return <GroupsList groups={allGroups} />;
 * };
 */
export function selectAllGroups(customGroups: Changelist[]): Changelist[] {
  const trackedGroup = selectTrackedGroup();
  const untrackedGroup = selectUntrackedGroup();

  const derivedGroups: Changelist[] = [];

  if (trackedGroup) {
    derivedGroups.push(trackedGroup);
  }

  if (untrackedGroup) {
    derivedGroups.push(untrackedGroup);
  }

  // Combine derived groups with custom groups, sorted by orderIndex
  return [...derivedGroups, ...customGroups].sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Hook version of selectTrackedGroup for use in React components.
 * Automatically subscribes to stagingStore changes.
 *
 * @returns A Changelist representing tracked files, or null if no files
 *
 * @example
 * const TrackedGroup = () => {
 *   const trackedGroup = useTrackedGroup();
 *   if (!trackedGroup) return null;
 *   return <GroupList group={trackedGroup} />;
 * };
 */
export function useTrackedGroup(): Changelist | null {
  const stagedFiles = useStagingStore((state) => state.stagedFiles);
  const unstagedFiles = useStagingStore((state) => state.unstagedFiles);

  const trackedFiles = [...stagedFiles, ...unstagedFiles];

  if (trackedFiles.length === 0) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: '__tracked__',
    name: 'Tracked Changes',
    type: CHANGELIST_TYPE_TRACKED,
    createdAt: now,
    updatedAt: now,
    items: trackedFiles.map(mapFileToChangelistItem),
    isSystemGenerated: true,
    orderIndex: -2,
    colorHexCode: '#3b82f6',
    description: 'Files tracked by Git with changes',
  };
}

/**
 * Hook version of selectUntrackedGroup for use in React components.
 * Automatically subscribes to stagingStore changes.
 *
 * @returns A Changelist representing untracked files, or null if no files
 *
 * @example
 * const UntrackedGroup = () => {
 *   const untrackedGroup = useUntrackedGroup();
 *   if (!untrackedGroup) return null;
 *   return <GroupList group={untrackedGroup} />;
 * };
 */
export function useUntrackedGroup(): Changelist | null {
  const untrackedFiles = useStagingStore((state) => state.untrackedFiles);

  if (untrackedFiles.length === 0) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: '__untracked__',
    name: 'Untracked Files',
    type: CHANGELIST_TYPE_UNTRACKED,
    createdAt: now,
    updatedAt: now,
    items: untrackedFiles.map(mapFileToChangelistItem),
    isSystemGenerated: true,
    orderIndex: -1,
    colorHexCode: '#6b7280',
    description: 'Files not tracked by Git',
  };
}
