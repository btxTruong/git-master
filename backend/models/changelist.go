package models

import "time"

// Constants for changelist types
const (
	ChangelistTypeCustom    = "custom"
	ChangelistTypeTracked   = "tracked"
	ChangelistTypeUntracked = "untracked"
)

// Validation constants
const (
	MaximumGroupNameLength = 100
	MinimumGroupNameLength = 1
)

// Schema version for future migrations
const ChangelistSchemaVersion = 1

// Changelist represents a group of file changes
type Changelist struct {
	IdentifierValue    string           `json:"id"`
	GroupName          string           `json:"name"`
	GroupType          string           `json:"type"` // "custom", "tracked", "untracked"
	CreatedAtTimestamp time.Time        `json:"createdAt"`
	UpdatedAtTimestamp time.Time        `json:"updatedAt"`
	FileItems          []ChangelistItem `json:"items"`
	IsSystemGenerated  bool             `json:"isSystemGenerated"`      // true for tracked/untracked
	OrderIndex         int              `json:"orderIndex"`             // for sorting groups
	ColorHexCode       string           `json:"colorHexCode,omitempty"` // optional UI color
	DescriptionText    string           `json:"description,omitempty"`  // optional description
}

// ChangelistItem represents a single file within a changelist group
type ChangelistItem struct {
	FilePath                 string    `json:"path"`
	TrackedSnapshotHash      string    `json:"trackedSnapshotHash,omitempty"`      // git hash when added (optional)
	NotesText                string    `json:"notes,omitempty"`                    // user notes about this file
	IsMissingFromWorkingTree bool      `json:"isMissingFromWorkingTree,omitempty"` // true if file was deleted
	AddedAtTimestamp         time.Time `json:"addedAt"`
	LastModifiedTimestamp    time.Time `json:"lastModifiedAt"`
}

// ChangelistConfiguration represents the root configuration file structure
type ChangelistConfiguration struct {
	SchemaVersion  int          `json:"version"`
	CustomGroups   []Changelist `json:"groups"`
	LastSavedAt    time.Time    `json:"lastSavedAt"`
	RepositoryPath string       `json:"repositoryPath"`
}

// ArchiveMetadata represents metadata for an archived changelist
type ArchiveMetadata struct {
	ArchiveIdentifier   string    `json:"id"`
	OriginalGroupName   string    `json:"originalGroupName"`
	ArchiveName         string    `json:"archiveName"`
	CreatedAtTimestamp  time.Time `json:"createdAt"`
	ArchivedAtTimestamp time.Time `json:"archivedAt"`
	FilePathsList       []string  `json:"filePaths"`
	OriginalBranchName  string    `json:"originalBranch"`
	OriginalCommitHash  string    `json:"originalCommitHash"`
	DescriptionText     string    `json:"description,omitempty"`
	TagsList            []string  `json:"tags,omitempty"`
	DiffFileSizeBytes   int64     `json:"diffFileSize"`
	TotalFilesCount     int       `json:"totalFilesCount"`
	TotalAdditionsCount int       `json:"totalAdditions"`
	TotalDeletionsCount int       `json:"totalDeletions"`
}

// ArchiveListEntry represents a summary of an archive for list views
type ArchiveListEntry struct {
	ArchiveIdentifier   string    `json:"id"`
	ArchiveName         string    `json:"archiveName"`
	OriginalGroupName   string    `json:"originalGroupName"`
	ArchivedAtTimestamp time.Time `json:"archivedAt"`
	TotalFilesCount     int       `json:"totalFilesCount"`
	DiffFileSizeBytes   int64     `json:"diffFileSize"`
	TagsList            []string  `json:"tags,omitempty"`
}

// CreateChangelistRequest represents a request to create a new changelist
type CreateChangelistRequest struct {
	GroupName       string   `json:"name"`
	DescriptionText string   `json:"description,omitempty"`
	ColorHexCode    string   `json:"colorHexCode,omitempty"`
	InitialFiles    []string `json:"initialFiles,omitempty"`
}

// UpdateChangelistRequest represents a request to update an existing changelist
type UpdateChangelistRequest struct {
	IdentifierValue string `json:"id"`
	GroupName       string `json:"name,omitempty"`
	DescriptionText string `json:"description,omitempty"`
	ColorHexCode    string `json:"colorHexCode,omitempty"`
}

// MoveFilesRequest represents a request to move files between changelists
type MoveFilesRequest struct {
	SourceGroupIdentifier      string   `json:"sourceGroupId"`
	DestinationGroupIdentifier string   `json:"destinationGroupId"`
	FilePathsList              []string `json:"filePaths"`
}

// CreateArchiveRequest represents a request to archive a changelist
type CreateArchiveRequest struct {
	GroupIdentifier string   `json:"groupId"`
	ArchiveName     string   `json:"archiveName"`
	DescriptionText string   `json:"description,omitempty"`
	TagsList        []string `json:"tags,omitempty"`
}

// RestoreArchiveRequest represents a request to restore an archived changelist
type RestoreArchiveRequest struct {
	ArchiveIdentifier     string `json:"archiveId"`
	TargetGroupIdentifier string `json:"targetGroupId,omitempty"` // optional, creates new group if empty
	NewGroupName          string `json:"newGroupName,omitempty"`  // used if creating new group
}
