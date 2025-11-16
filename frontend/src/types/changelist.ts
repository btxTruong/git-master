// Constants for changelist types
export const CHANGELIST_TYPE_CUSTOM = 'custom';
export const CHANGELIST_TYPE_TRACKED = 'tracked';
export const CHANGELIST_TYPE_UNTRACKED = 'untracked';

export type ChangelistType =
  | typeof CHANGELIST_TYPE_CUSTOM
  | typeof CHANGELIST_TYPE_TRACKED
  | typeof CHANGELIST_TYPE_UNTRACKED;

// Validation constants
export const MAXIMUM_GROUP_NAME_LENGTH = 100;
export const MINIMUM_GROUP_NAME_LENGTH = 1;

// Schema version for future migrations
export const CHANGELIST_SCHEMA_VERSION = 1;

// Changelist represents a group of file changes
export interface Changelist {
  id: string;
  name: string;
  type: ChangelistType;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  items: ChangelistItem[];
  isSystemGenerated: boolean; // true for tracked/untracked
  orderIndex: number; // for sorting groups
  colorHexCode?: string; // optional UI color
  description?: string; // optional description
}

// ChangelistItem represents a single file within a changelist group
export interface ChangelistItem {
  path: string;
  trackedSnapshotHash?: string; // git hash when added (optional)
  notes?: string; // user notes about this file
  isMissingFromWorkingTree?: boolean; // true if file was deleted
  addedAt: string; // ISO 8601 timestamp
  lastModifiedAt: string; // ISO 8601 timestamp
}

// ChangelistConfiguration represents the root configuration file structure
export interface ChangelistConfiguration {
  version: number;
  groups: Changelist[];
  lastSavedAt: string; // ISO 8601 timestamp
  repositoryPath: string;
}

// ArchiveMetadata represents metadata for an archived changelist
export interface ArchiveMetadata {
  id: string;
  originalGroupName: string;
  archiveName: string;
  createdAt: string; // ISO 8601 timestamp
  archivedAt: string; // ISO 8601 timestamp
  filePaths: string[];
  originalBranch: string;
  originalCommitHash: string;
  description?: string;
  tags?: string[];
  diffFileSize: number;
  totalFilesCount: number;
  totalAdditions: number;
  totalDeletions: number;
}

// ArchiveListEntry represents a summary of an archive for list views
export interface ArchiveListEntry {
  id: string;
  archiveName: string;
  originalGroupName: string;
  archivedAt: string; // ISO 8601 timestamp
  totalFilesCount: number;
  diffFileSize: number;
  tags?: string[];
}

// CreateChangelistRequest represents a request to create a new changelist
export interface CreateChangelistRequest {
  name: string;
  description?: string;
  colorHexCode?: string;
  initialFiles?: string[];
}

// UpdateChangelistRequest represents a request to update an existing changelist
export interface UpdateChangelistRequest {
  id: string;
  name?: string;
  description?: string;
  colorHexCode?: string;
}

// MoveFilesRequest represents a request to move files between changelists
export interface MoveFilesRequest {
  sourceGroupId: string;
  destinationGroupId: string;
  filePaths: string[];
}

// CreateArchiveRequest represents a request to archive a changelist
export interface CreateArchiveRequest {
  groupId: string;
  archiveName: string;
  description?: string;
  tags?: string[];
}

// RestoreArchiveRequest represents a request to restore an archived changelist
export interface RestoreArchiveRequest {
  archiveId: string;
  targetGroupId?: string; // optional, creates new group if empty
  newGroupName?: string; // used if creating new group
}

// Helper type for UI state
export interface ChangelistUIState {
  selectedGroupId: string | null;
  selectedFilePaths: string[];
  expandedGroupIds: string[];
  isLoading: boolean;
  error: string | null;
}

// Helper type for archive UI state
export interface ArchiveUIState {
  selectedArchiveId: string | null;
  isLoading: boolean;
  error: string | null;
}
