import type { Changelist, ArchiveMetadata, ArchiveListEntry } from '@/types/changelist';

// Backend model interfaces (from Go types)
interface BackendChangelist {
  IdentifierValue: string;
  GroupName: string;
  GroupType: string;
  CreatedAtTimestamp: string;
  UpdatedAtTimestamp: string;
  FileItems: BackendChangelistItem[];
  IsSystemGenerated: boolean;
  OrderIndex: number;
  ColorHexCode?: string;
  DescriptionText?: string;
}

interface BackendChangelistItem {
  FilePath: string;
  TrackedSnapshotHash?: string;
  NotesText?: string;
  IsMissingFromWorkingTree?: boolean;
  AddedAtTimestamp: string;
  LastModifiedTimestamp: string;
}

interface BackendArchiveMetadata {
  ArchiveIdentifier: string;
  OriginalGroupName: string;
  ArchiveName: string;
  CreatedAtTimestamp: string;
  ArchivedAtTimestamp: string;
  FilePathsList: string[];
  OriginalBranchName: string;
  OriginalCommitHash: string;
  DescriptionText?: string;
  TagsList?: string[];
  DiffFileSizeBytes: number;
  TotalFilesCount: number;
  TotalAdditionsCount: number;
  TotalDeletionsCount: number;
}

interface BackendArchiveListEntry {
  ArchiveIdentifier: string;
  ArchiveName: string;
  OriginalGroupName: string;
  ArchivedAtTimestamp: string;
  TotalFilesCount: number;
  DiffFileSizeBytes: number;
  TagsList?: string[];
}

// Lazy-loaded Wails bindings
let CreateChangelistGroup:
  | ((repositoryPath: string, groupName: string) => Promise<BackendChangelist>)
  | null = null;
let RenameChangelistGroup:
  | ((repositoryPath: string, groupId: string, newName: string) => Promise<void>)
  | null = null;
let DeleteChangelistGroup: ((repositoryPath: string, groupId: string) => Promise<void>) | null =
  null;
let AddPathsToChangelistGroup:
  | ((repositoryPath: string, groupId: string, filePaths: string[]) => Promise<void>)
  | null = null;
let RemovePathsFromChangelistGroup:
  | ((repositoryPath: string, groupId: string, filePaths: string[]) => Promise<void>)
  | null = null;
let MovePathsBetweenChangelistGroups:
  | ((
      repositoryPath: string,
      sourceGroupId: string,
      targetGroupId: string,
      filePaths: string[]
    ) => Promise<void>)
  | null = null;
let GetAllChangelistGroups: ((repositoryPath: string) => Promise<BackendChangelist[]>) | null =
  null;
let ReconcileChangelistsWithGitRepositoryStatus:
  | ((repositoryPath: string, gitStatusOutput: string) => Promise<void>)
  | null = null;
let RemoveMissingFilesFromAllGroups: ((repositoryPath: string) => Promise<number>) | null = null;

// Archive service bindings
let ArchiveChangelistGroup:
  | ((
      changelist: BackendChangelist,
      archiveName: string,
      description: string,
      tags: string[]
    ) => Promise<BackendArchiveMetadata>)
  | null = null;
let GetArchiveList: (() => Promise<BackendArchiveListEntry[]>) | null = null;
let GetArchiveMetadata: ((archiveName: string) => Promise<BackendArchiveMetadata>) | null = null;
let GetArchiveDiffContent: ((archiveName: string) => Promise<string>) | null = null;
let DeleteArchiveByName: ((archiveName: string) => Promise<void>) | null = null;
let RenameArchiveByName:
  | ((oldArchiveName: string, newArchiveName: string) => Promise<void>)
  | null = null;

// Lazy load Wails bindings
async function loadBindings() {
  if (CreateChangelistGroup) return;

  try {
    const ChangelistService = await import('../../wailsjs/go/services/ChangelistService');
    CreateChangelistGroup = ChangelistService.CreateChangelistGroup;
    RenameChangelistGroup = ChangelistService.RenameChangelistGroup;
    DeleteChangelistGroup = ChangelistService.DeleteChangelistGroup;
    AddPathsToChangelistGroup = ChangelistService.AddPathsToChangelistGroup;
    RemovePathsFromChangelistGroup = ChangelistService.RemovePathsFromChangelistGroup;
    MovePathsBetweenChangelistGroups = ChangelistService.MovePathsBetweenChangelistGroups;
    GetAllChangelistGroups = ChangelistService.GetAllChangelistGroups;
    ReconcileChangelistsWithGitRepositoryStatus =
      ChangelistService.ReconcileChangelistsWithGitRepositoryStatus;
    RemoveMissingFilesFromAllGroups = ChangelistService.RemoveMissingFilesFromAllGroups;
  } catch (error) {
    console.error('Failed to load ChangelistService bindings:', error);
    throw new Error('Wails ChangelistService bindings not available');
  }
}

async function loadArchiveBindings() {
  if (ArchiveChangelistGroup) return;

  try {
    const ArchiveService = await import('../../wailsjs/go/services/ArchiveService');
    ArchiveChangelistGroup = (ArchiveService as any).ArchiveChangelistGroup;
    GetArchiveList = (ArchiveService as any).GetArchiveList;
    GetArchiveMetadata = (ArchiveService as any).GetArchiveMetadata;
    GetArchiveDiffContent = (ArchiveService as any).GetArchiveDiffContent;
    DeleteArchiveByName = (ArchiveService as any).DeleteArchiveByName;
    RenameArchiveByName = (ArchiveService as any).RenameArchiveByName;
  } catch (error) {
    console.error('Failed to load ArchiveService bindings:', error);
    throw new Error('Wails ArchiveService bindings not available');
  }
}

// Conversion functions
function convertBackendChangelistToFrontend(backend: BackendChangelist): Changelist {
  return {
    id: backend.IdentifierValue,
    name: backend.GroupName,
    type: backend.GroupType as any,
    createdAt: backend.CreatedAtTimestamp,
    updatedAt: backend.UpdatedAtTimestamp,
    items:
      backend.FileItems?.map((item) => ({
        path: item.FilePath,
        trackedSnapshotHash: item.TrackedSnapshotHash,
        notes: item.NotesText,
        isMissingFromWorkingTree: item.IsMissingFromWorkingTree,
        addedAt: item.AddedAtTimestamp,
        lastModifiedAt: item.LastModifiedTimestamp,
      })) || [],
    isSystemGenerated: backend.IsSystemGenerated,
    orderIndex: backend.OrderIndex,
    colorHexCode: backend.ColorHexCode,
    description: backend.DescriptionText,
  };
}

function convertBackendArchiveMetadataToFrontend(backend: BackendArchiveMetadata): ArchiveMetadata {
  return {
    id: backend.ArchiveIdentifier,
    originalGroupName: backend.OriginalGroupName,
    archiveName: backend.ArchiveName,
    createdAt: backend.CreatedAtTimestamp,
    archivedAt: backend.ArchivedAtTimestamp,
    filePaths: backend.FilePathsList || [],
    originalBranch: backend.OriginalBranchName,
    originalCommitHash: backend.OriginalCommitHash,
    description: backend.DescriptionText,
    tags: backend.TagsList,
    diffFileSize: backend.DiffFileSizeBytes,
    totalFilesCount: backend.TotalFilesCount,
    totalAdditions: backend.TotalAdditionsCount,
    totalDeletions: backend.TotalDeletionsCount,
  };
}

function convertBackendArchiveListEntryToFrontend(
  backend: BackendArchiveListEntry
): ArchiveListEntry {
  return {
    id: backend.ArchiveIdentifier,
    archiveName: backend.ArchiveName,
    originalGroupName: backend.OriginalGroupName,
    archivedAt: backend.ArchivedAtTimestamp,
    totalFilesCount: backend.TotalFilesCount,
    diffFileSize: backend.DiffFileSizeBytes,
    tags: backend.TagsList,
  };
}

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
  await loadBindings();

  if (!CreateChangelistGroup) {
    throw new Error('CreateChangelistGroup binding not available');
  }

  const result = await CreateChangelistGroup(repositoryPath, groupName);
  return convertBackendChangelistToFrontend(result);
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
  await loadBindings();

  if (!RenameChangelistGroup) {
    throw new Error('RenameChangelistGroup binding not available');
  }

  await RenameChangelistGroup(repositoryPath, groupId, newName);
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
  await loadBindings();

  if (!DeleteChangelistGroup) {
    throw new Error('DeleteChangelistGroup binding not available');
  }

  await DeleteChangelistGroup(repositoryPath, groupId);
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
  await loadBindings();

  if (!AddPathsToChangelistGroup) {
    throw new Error('AddPathsToChangelistGroup binding not available');
  }

  await AddPathsToChangelistGroup(repositoryPath, groupId, filePaths);
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
  await loadBindings();

  if (!RemovePathsFromChangelistGroup) {
    throw new Error('RemovePathsFromChangelistGroup binding not available');
  }

  await RemovePathsFromChangelistGroup(repositoryPath, groupId, filePaths);
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
  await loadBindings();

  if (!MovePathsBetweenChangelistGroups) {
    throw new Error('MovePathsBetweenChangelistGroups binding not available');
  }

  await MovePathsBetweenChangelistGroups(repositoryPath, sourceGroupId, targetGroupId, filePaths);
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
  await loadBindings();

  if (!GetAllChangelistGroups) {
    throw new Error('GetAllChangelistGroups binding not available');
  }

  const result = await GetAllChangelistGroups(repositoryPath);
  return result.map(convertBackendChangelistToFrontend);
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
  await loadBindings();

  if (!ReconcileChangelistsWithGitRepositoryStatus) {
    throw new Error('ReconcileChangelistsWithGitRepositoryStatus binding not available');
  }

  await ReconcileChangelistsWithGitRepositoryStatus(repositoryPath, gitStatusOutput);
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
  await loadBindings();

  if (!RemoveMissingFilesFromAllGroups) {
    throw new Error('RemoveMissingFilesFromAllGroups binding not available');
  }

  return await RemoveMissingFilesFromAllGroups(repositoryPath);
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
  await loadArchiveBindings();

  if (!ArchiveChangelistGroup) {
    throw new Error('ArchiveChangelistGroup binding not available');
  }

  // Convert frontend changelist to backend format
  const backendChangelist: BackendChangelist = {
    IdentifierValue: changelist.id,
    GroupName: changelist.name,
    GroupType: changelist.type,
    CreatedAtTimestamp: changelist.createdAt,
    UpdatedAtTimestamp: changelist.updatedAt,
    FileItems: changelist.items.map((item) => ({
      FilePath: item.path,
      TrackedSnapshotHash: item.trackedSnapshotHash,
      NotesText: item.notes,
      IsMissingFromWorkingTree: item.isMissingFromWorkingTree,
      AddedAtTimestamp: item.addedAt,
      LastModifiedTimestamp: item.lastModifiedAt,
    })),
    IsSystemGenerated: changelist.isSystemGenerated,
    OrderIndex: changelist.orderIndex,
    ColorHexCode: changelist.colorHexCode,
    DescriptionText: changelist.description,
  };

  const result = await ArchiveChangelistGroup(backendChangelist, archiveName, description, tags);
  return convertBackendArchiveMetadataToFrontend(result);
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
  await loadArchiveBindings();

  if (!GetArchiveList) {
    throw new Error('GetArchiveList binding not available');
  }

  const result = await GetArchiveList();
  return result.map(convertBackendArchiveListEntryToFrontend);
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
  await loadArchiveBindings();

  if (!GetArchiveMetadata) {
    throw new Error('GetArchiveMetadata binding not available');
  }

  const result = await GetArchiveMetadata(archiveName);
  return convertBackendArchiveMetadataToFrontend(result);
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
  await loadArchiveBindings();

  if (!GetArchiveDiffContent) {
    throw new Error('GetArchiveDiffContent binding not available');
  }

  return await GetArchiveDiffContent(archiveName);
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
  await loadArchiveBindings();

  if (!DeleteArchiveByName) {
    throw new Error('DeleteArchiveByName binding not available');
  }

  await DeleteArchiveByName(archiveName);
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
  await loadArchiveBindings();

  if (!RenameArchiveByName) {
    throw new Error('RenameArchiveByName binding not available');
  }

  await RenameArchiveByName(oldArchiveName, newArchiveName);
}
