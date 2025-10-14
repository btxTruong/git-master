package services

import (
	"encoding/json"
	"fmt"
	"git-master/backend/models"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Archive directory and file name patterns
const (
	// ArchiveBaseDirectory is the base directory for all archive storage
	ArchiveBaseDirectory = ".git-master"

	// ArchiveDiffExtension is the file extension for archived diffs
	ArchiveDiffExtension = ".diff"

	// ArchiveMetadataExtension is the file extension for archive metadata
	ArchiveMetadataExtension = ".meta.json"

	// DirectoryPermissions defines the permissions for created directories
	DirectoryPermissions = 0755

	// FilePermissions defines the permissions for created files
	FilePermissions = 0644
)

// Regular expressions for sanitization
var (
	// DangerousFilenameCharactersPattern matches characters that are unsafe for filenames
	DangerousFilenameCharactersPattern = regexp.MustCompile(`[/\\:*?"<>|]`)

	// MultipleWhitespacePattern matches multiple consecutive whitespace characters
	MultipleWhitespacePattern = regexp.MustCompile(`\s+`)

	// MultipleHyphensPattern matches multiple consecutive hyphens
	MultipleHyphensPattern = regexp.MustCompile(`-+`)
)

// GetArchiveDirectoryPath returns the archive directory path for a repository
func GetArchiveDirectoryPath(repositoryPath string) (string, error) {
	// Get the home directory
	homeDirectory, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}

	// Get the repository name (base name of repository path)
	repositoryName := filepath.Base(repositoryPath)
	if repositoryName == "" || repositoryName == "." || repositoryName == "/" {
		return "", fmt.Errorf("invalid repository path: %s", repositoryPath)
	}

	// Construct archive directory path: ~/.git-master/{repo-name}/
	archiveDirectory := filepath.Join(homeDirectory, ArchiveBaseDirectory, repositoryName)

	return archiveDirectory, nil
}

// SanitizeArchiveName sanitizes a user-provided archive name for filesystem safety
func SanitizeArchiveName(archiveName string) string {
	// Trim leading and trailing whitespace
	sanitized := strings.TrimSpace(archiveName)

	// Replace dangerous characters with empty string
	sanitized = DangerousFilenameCharactersPattern.ReplaceAllString(sanitized, "")

	// Replace multiple whitespace with single hyphen
	sanitized = MultipleWhitespacePattern.ReplaceAllString(sanitized, "-")

	// Replace multiple consecutive hyphens with single hyphen
	sanitized = MultipleHyphensPattern.ReplaceAllString(sanitized, "-")

	// Trim leading and trailing hyphens
	sanitized = strings.Trim(sanitized, "-")

	// If the result is empty, use a default name
	if sanitized == "" {
		sanitized = "archive"
	}

	return sanitized
}

// EnsureArchiveDirectoryExists creates the archive directory structure if it doesn't exist
func EnsureArchiveDirectoryExists(repositoryPath string) error {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return err
	}

	// Create directory with proper permissions (creates parent directories too)
	err = os.MkdirAll(archiveDirectory, DirectoryPermissions)
	if err != nil {
		return fmt.Errorf("failed to create archive directory: %w", err)
	}

	return nil
}

// GetUniqueArchiveName generates a unique archive name by appending a number if the name already exists
func GetUniqueArchiveName(repositoryPath string, desiredArchiveName string) (string, error) {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return "", err
	}

	// Sanitize the desired name
	baseName := SanitizeArchiveName(desiredArchiveName)
	uniqueName := baseName
	counter := 1

	// Check if archive with this name already exists
	for {
		diffFilePath := filepath.Join(archiveDirectory, uniqueName+ArchiveDiffExtension)
		metadataFilePath := filepath.Join(archiveDirectory, uniqueName+ArchiveMetadataExtension)

		// Check if either file exists
		_, diffErr := os.Stat(diffFilePath)
		_, metaErr := os.Stat(metadataFilePath)

		// If neither exists, the name is unique
		if os.IsNotExist(diffErr) && os.IsNotExist(metaErr) {
			break
		}

		// Name exists, append counter and try again
		uniqueName = fmt.Sprintf("%s-%d", baseName, counter)
		counter++
	}

	return uniqueName, nil
}

// ReadArchiveMetadata reads and parses the metadata file for an archive
func ReadArchiveMetadata(repositoryPath string, archiveName string) (*models.ArchiveMetadata, error) {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return nil, err
	}

	metadataFilePath := filepath.Join(archiveDirectory, archiveName+ArchiveMetadataExtension)

	// Read metadata file
	metadataBytes, err := os.ReadFile(metadataFilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read metadata file: %w", err)
	}

	// Parse JSON
	var metadata models.ArchiveMetadata
	err = json.Unmarshal(metadataBytes, &metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to parse metadata JSON: %w", err)
	}

	return &metadata, nil
}

// WriteArchiveMetadata writes archive metadata to disk
func WriteArchiveMetadata(repositoryPath string, archiveName string, metadata *models.ArchiveMetadata) error {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return err
	}

	metadataFilePath := filepath.Join(archiveDirectory, archiveName+ArchiveMetadataExtension)

	// Marshal to JSON with indentation for readability
	metadataBytes, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal metadata to JSON: %w", err)
	}

	// Write to file with proper permissions
	err = os.WriteFile(metadataFilePath, metadataBytes, FilePermissions)
	if err != nil {
		return fmt.Errorf("failed to write metadata file: %w", err)
	}

	return nil
}

// ListAllArchivesForRepository returns all archives for a repository with their metadata
func ListAllArchivesForRepository(repositoryPath string) ([]models.ArchiveListEntry, error) {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return nil, err
	}

	// Check if archive directory exists
	_, err = os.Stat(archiveDirectory)
	if os.IsNotExist(err) {
		// No archives exist yet, return empty list
		return []models.ArchiveListEntry{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to access archive directory: %w", err)
	}

	// Read directory contents
	entries, err := os.ReadDir(archiveDirectory)
	if err != nil {
		return nil, fmt.Errorf("failed to read archive directory: %w", err)
	}

	// Collect all metadata files
	metadataFileNames := []string{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		fileName := entry.Name()
		if strings.HasSuffix(fileName, ArchiveMetadataExtension) {
			// Remove the .meta.json extension to get the archive name
			archiveName := strings.TrimSuffix(fileName, ArchiveMetadataExtension)
			metadataFileNames = append(metadataFileNames, archiveName)
		}
	}

	// Read metadata for each archive
	archiveList := []models.ArchiveListEntry{}
	for _, archiveName := range metadataFileNames {
		metadata, err := ReadArchiveMetadata(repositoryPath, archiveName)
		if err != nil {
			// Log error but continue with other archives
			// In production, you might want to use proper logging
			continue
		}

		// Create list entry from metadata
		listEntry := models.ArchiveListEntry{
			ArchiveIdentifier:   metadata.ArchiveIdentifier,
			ArchiveName:         metadata.ArchiveName,
			OriginalGroupName:   metadata.OriginalGroupName,
			ArchivedAtTimestamp: metadata.ArchivedAtTimestamp,
			TotalFilesCount:     metadata.TotalFilesCount,
			DiffFileSizeBytes:   metadata.DiffFileSizeBytes,
			TagsList:            metadata.TagsList,
		}

		archiveList = append(archiveList, listEntry)
	}

	return archiveList, nil
}

// GetArchiveDiffPath returns the full path to an archive's diff file
func GetArchiveDiffPath(repositoryPath string, archiveName string) (string, error) {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return "", err
	}

	return filepath.Join(archiveDirectory, archiveName+ArchiveDiffExtension), nil
}

// GetArchiveMetadataPath returns the full path to an archive's metadata file
func GetArchiveMetadataPath(repositoryPath string, archiveName string) (string, error) {
	archiveDirectory, err := GetArchiveDirectoryPath(repositoryPath)
	if err != nil {
		return "", err
	}

	return filepath.Join(archiveDirectory, archiveName+ArchiveMetadataExtension), nil
}

// RenameArchive renames an archive atomically (both .diff and .meta.json files)
func RenameArchive(repositoryPath string, oldArchiveName string, newArchiveName string) error {
	// Validate that the old archive exists
	oldDiffPath, err := GetArchiveDiffPath(repositoryPath, oldArchiveName)
	if err != nil {
		return err
	}

	oldMetadataPath, err := GetArchiveMetadataPath(repositoryPath, oldArchiveName)
	if err != nil {
		return err
	}

	// Check if old archive files exist
	_, diffErr := os.Stat(oldDiffPath)
	if os.IsNotExist(diffErr) {
		return fmt.Errorf("archive does not exist: %s", oldArchiveName)
	}

	_, metaErr := os.Stat(oldMetadataPath)
	if os.IsNotExist(metaErr) {
		return fmt.Errorf("archive metadata does not exist: %s", oldArchiveName)
	}

	// Sanitize the new archive name
	sanitizedNewName := SanitizeArchiveName(newArchiveName)

	// Get new file paths
	newDiffPath, err := GetArchiveDiffPath(repositoryPath, sanitizedNewName)
	if err != nil {
		return err
	}

	newMetadataPath, err := GetArchiveMetadataPath(repositoryPath, sanitizedNewName)
	if err != nil {
		return err
	}

	// Check for name conflicts (prevent overwrite)
	_, newDiffErr := os.Stat(newDiffPath)
	_, newMetaErr := os.Stat(newMetadataPath)
	if !os.IsNotExist(newDiffErr) || !os.IsNotExist(newMetaErr) {
		return fmt.Errorf("archive with name '%s' already exists", sanitizedNewName)
	}

	// Rename diff file first
	err = os.Rename(oldDiffPath, newDiffPath)
	if err != nil {
		return fmt.Errorf("failed to rename diff file: %w", err)
	}

	// Rename metadata file (with rollback on failure)
	err = os.Rename(oldMetadataPath, newMetadataPath)
	if err != nil {
		// Rollback: rename diff file back to original name
		rollbackErr := os.Rename(newDiffPath, oldDiffPath)
		if rollbackErr != nil {
			return fmt.Errorf("failed to rename metadata file and rollback failed: %w (rollback error: %v)", err, rollbackErr)
		}
		return fmt.Errorf("failed to rename metadata file: %w", err)
	}

	// Update the ArchiveName field in the metadata file
	metadata, err := ReadArchiveMetadata(repositoryPath, sanitizedNewName)
	if err != nil {
		// Rollback both renames if we can't read metadata
		os.Rename(newMetadataPath, oldMetadataPath)
		os.Rename(newDiffPath, oldDiffPath)
		return fmt.Errorf("failed to read metadata after rename: %w", err)
	}

	// Update the archive name in metadata
	metadata.ArchiveName = sanitizedNewName

	// Write the updated metadata
	err = WriteArchiveMetadata(repositoryPath, sanitizedNewName, metadata)
	if err != nil {
		// Rollback both renames if we can't update metadata
		os.Rename(newMetadataPath, oldMetadataPath)
		os.Rename(newDiffPath, oldDiffPath)
		return fmt.Errorf("failed to update metadata with new name: %w", err)
	}

	return nil
}

// DeleteArchive removes an archive and its metadata from disk
func DeleteArchive(repositoryPath string, archiveName string) error {
	// Get both file paths
	diffPath, err := GetArchiveDiffPath(repositoryPath, archiveName)
	if err != nil {
		return err
	}

	metadataPath, err := GetArchiveMetadataPath(repositoryPath, archiveName)
	if err != nil {
		return err
	}

	// Delete diff file (ignore error if file doesn't exist)
	diffErr := os.Remove(diffPath)
	if diffErr != nil && !os.IsNotExist(diffErr) {
		return fmt.Errorf("failed to delete diff file: %w", diffErr)
	}

	// Delete metadata file (ignore error if file doesn't exist)
	metaErr := os.Remove(metadataPath)
	if metaErr != nil && !os.IsNotExist(metaErr) {
		return fmt.Errorf("failed to delete metadata file: %w", metaErr)
	}

	return nil
}
