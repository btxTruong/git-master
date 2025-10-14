import type { Changelist, ArchiveMetadata, ArchiveListEntry } from '@/types/changelist';
import * as ChangelistServiceBindings from '../../wailsjs/go/services/ChangelistService';
import * as ArchiveServiceBindings from '../../wailsjs/go/services/ArchiveService';
import type { models } from '../../wailsjs/go/models';

// ========================================
// Changelist CRUD Operations
// ========================================

/**
 * Creates a new changelist group.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param groupName - Name for the new changelist group
 * @returns The newly created changelist
 *
 * @example
 * const changelist = await createChangelistGroup('/path/to/repo', 'Feature Work');
 */
export async function createChangelistGroup(
  repositoryPath: string,
  groupName: string
): Promise<Changelist> {
  const result = await ChangelistServiceBindings.CreateChangelistGroup(repositoryPath, groupName);
  return result as unknown as Changelist;
}

/**
 * Renames an existing changelist group.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param groupId - ID of the changelist group to rename
 * @param newName - New name for the group
 *
 * @example
 * await renameChangelistGroup('/path/to/repo', 'group-id-123', 'New Feature');
 */
export async function renameChangelistGroup(
  repositoryPath: string,
  groupId: string,
  newName: string
): Promise<void> {
  await ChangelistServiceBindings.RenameChangelistGroup(repositoryPath, groupId, newName);
}

/**
 * Deletes a changelist group.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param groupId - ID of the changelist group to delete
 *
 * @example
 * await deleteChangelistGroup('/path/to/repo', 'group-id-123');
 */
export async function deleteChangelistGroup(
  repositoryPath: string,
  groupId: string
): Promise<void> {
  await ChangelistServiceBindings.DeleteChangelistGroup(repositoryPath, groupId);
}

/**
 * Adds file paths to a changelist group.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param groupId - ID of the target changelist group
 * @param filePaths - Array of file paths to add
 *
 * @example
 * await addPathsToChangelistGroup('/path/to/repo', 'group-id-123', ['src/file.ts', 'src/other.ts']);
 */
export async function addPathsToChangelistGroup(
  repositoryPath: string,
  groupId: string,
  filePaths: string[]
): Promise<void> {
  await ChangelistServiceBindings.AddPathsToChangelistGroup(repositoryPath, groupId, filePaths);
}

/**
 * Removes file paths from a changelist group.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param groupId - ID of the changelist group
 * @param filePaths - Array of file paths to remove
 *
 * @example
 * await removePathsFromChangelistGroup('/path/to/repo', 'group-id-123', ['src/file.ts']);
 */
export async function removePathsFromChangelistGroup(
  repositoryPath: string,
  groupId: string,
  filePaths: string[]
): Promise<void> {
  await ChangelistServiceBindings.RemovePathsFromChangelistGroup(
    repositoryPath,
    groupId,
    filePaths
  );
}

/**
 * Moves file paths between changelist groups atomically.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param sourceGroupId - ID of the source changelist group
 * @param targetGroupId - ID of the target changelist group
 * @param filePaths - Array of file paths to move
 *
 * @example
 * await movePathsBetweenChangelistGroups('/path/to/repo', 'source-id', 'target-id', ['src/file.ts']);
 */
export async function movePathsBetweenChangelistGroups(
  repositoryPath: string,
  sourceGroupId: string,
  targetGroupId: string,
  filePaths: string[]
): Promise<void> {
  await ChangelistServiceBindings.MovePathsBetweenChangelistGroups(
    repositoryPath,
    sourceGroupId,
    targetGroupId,
    filePaths
  );
}

/**
 * Retrieves all changelist groups for a repository.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @returns Array of all changelist groups
 *
 * @example
 * const changelists = await getAllChangelistGroups('/path/to/repo');
 */
export async function getAllChangelistGroups(repositoryPath: string): Promise<Changelist[]> {
  const result = await ChangelistServiceBindings.GetAllChangelistGroups(repositoryPath);
  return result as unknown as Changelist[];
}

/**
 * Reconciles changelist paths with current Git repository status.
 * Updates paths that have been renamed and marks missing files.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @param gitStatusOutput - Output from git status --porcelain=v2
 *
 * @example
 * const statusOutput = await getGitStatus();
 * await reconcileChangelistsWithGitStatus('/path/to/repo', statusOutput);
 */
export async function reconcileChangelistsWithGitStatus(
  repositoryPath: string,
  gitStatusOutput: string
): Promise<void> {
  await ChangelistServiceBindings.ReconcileChangelistsWithGitRepositoryStatus(
    repositoryPath,
    gitStatusOutput
  );
}

/**
 * Removes all files marked as missing from all changelist groups.
 *
 * @param repositoryPath - Absolute path to the git repository
 * @returns Number of files removed
 *
 * @example
 * const removedCount = await removeMissingFilesFromAllGroups('/path/to/repo');
 * console.log(`Removed ${removedCount} missing files`);
 */
export async function removeMissingFilesFromAllGroups(repositoryPath: string): Promise<number> {
  return await ChangelistServiceBindings.RemoveMissingFilesFromAllGroups(repositoryPath);
}

// ========================================
// Archive Operations
// ========================================

/**
 * Archives a changelist group by creating a diff file and metadata.
 *
 * @param changelist - The changelist to archive
 * @param archiveName - Name for the archive
 * @param description - Optional description
 * @param tags - Optional tags for categorization
 * @returns Metadata for the created archive
 *
 * @example
 * const metadata = await archiveChangelistGroup(
 *   changelist,
 *   'feature-v1-backup',
 *   'Backup before refactor',
 *   ['backup', 'feature']
 * );
 */
export async function archiveChangelistGroup(
  changelist: Changelist,
  archiveName: string,
  description: string = '',
  tags: string[] = []
): Promise<ArchiveMetadata> {
  const result = await ArchiveServiceBindings.ArchiveChangelistGroup(
    changelist as unknown as models.Changelist,
    archiveName,
    description,
    tags
  );
  return result as unknown as ArchiveMetadata;
}

/**
 * Retrieves a list of all archives for the current repository.
 *
 * @returns Array of archive list entries
 *
 * @example
 * const archives = await getArchiveList();
 */
export async function getArchiveList(): Promise<ArchiveListEntry[]> {
  const result = await ArchiveServiceBindings.GetArchiveList();
  return result as unknown as ArchiveListEntry[];
}

/**
 * Retrieves detailed metadata for a specific archive.
 *
 * @param archiveName - Name of the archive
 * @returns Full archive metadata
 *
 * @example
 * const metadata = await getArchiveMetadata('feature-v1-backup');
 */
export async function getArchiveMetadata(archiveName: string): Promise<ArchiveMetadata> {
  const result = await ArchiveServiceBindings.GetArchiveMetadata(archiveName);
  return result as unknown as ArchiveMetadata;
}

/**
 * Retrieves the diff content for a specific archive.
 *
 * @param archiveName - Name of the archive
 * @returns Unified diff content as a string
 *
 * @example
 * const diffContent = await getArchiveDiffContent('feature-v1-backup');
 */
export async function getArchiveDiffContent(archiveName: string): Promise<string> {
  return await ArchiveServiceBindings.GetArchiveDiffContent(archiveName);
}

/**
 * Deletes an archive from disk.
 *
 * @param archiveName - Name of the archive to delete
 *
 * @example
 * await deleteArchiveByName('old-feature-backup');
 */
export async function deleteArchiveByName(archiveName: string): Promise<void> {
  await ArchiveServiceBindings.DeleteArchiveByName(archiveName);
}

/**
 * Renames an existing archive.
 *
 * @param oldArchiveName - Current name of the archive
 * @param newArchiveName - New name for the archive
 *
 * @example
 * await renameArchiveByName('feature-backup', 'feature-v1-final');
 */
export async function renameArchiveByName(
  oldArchiveName: string,
  newArchiveName: string
): Promise<void> {
  await ArchiveServiceBindings.RenameArchiveByName(oldArchiveName, newArchiveName);
}
