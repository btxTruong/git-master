package services

import (
	"context"
	"encoding/json"
	"fmt"
	"git-master/backend/models"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Lock acquisition constants
const (
	lockAcquisitionTimeoutSeconds   = 3
	lockPollingIntervalMilliseconds = 50
	changelistDirectoryName         = ".git-master"
	changelistConfigurationFileName = "changelists.json"
	changelistLockFileName          = "changelists.lock"
	temporaryFileSuffix             = ".tmp"
	filePermissionsData             = 0644
	filePermissionsDirectory        = 0755
)

// Validation constants
const (
	maximumGroupNameLength = 100
	minimumGroupNameLength = 1
)

// Reserved group names that cannot be used for custom groups
var reservedGroupNames = map[string]bool{
	"tracked":   true,
	"untracked": true,
	"default":   true,
}

// ChangelistService handles changelist operations
type ChangelistService struct {
	ctx context.Context
}

// NewChangelistService creates a new changelist service
func NewChangelistService() *ChangelistService {
	return &ChangelistService{}
}

// Startup is called when the app starts
func (service *ChangelistService) Startup(ctx context.Context) {
	service.ctx = ctx
}

// acquireChangelistConfigurationLock acquires an exclusive lock for changelist operations
// Returns an unlock function that must be called to release the lock, and an error if lock acquisition fails
func (service *ChangelistService) acquireChangelistConfigurationLock(repositoryPath string) (unlockFunction func(), errorResult error) {
	lockFilePath := service.getChangelistLockFilePath(repositoryPath)

	// Ensure .git-master directory exists
	changelistDirectoryPath := service.getChangelistDirectoryPath(repositoryPath)
	if directoryCreationError := os.MkdirAll(changelistDirectoryPath, filePermissionsDirectory); directoryCreationError != nil {
		return nil, fmt.Errorf("failed to create changelist directory: %w", directoryCreationError)
	}

	startTimeMilliseconds := time.Now().UnixMilli()
	timeoutMilliseconds := int64(lockAcquisitionTimeoutSeconds * 1000)
	pollingIntervalDuration := time.Duration(lockPollingIntervalMilliseconds) * time.Millisecond

	for {
		// Try to create lock file atomically
		lockFile, lockCreationError := os.OpenFile(lockFilePath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, filePermissionsData)

		if lockCreationError == nil {
			// Successfully acquired lock
			lockFile.Close()

			// Return unlock function
			unlockFunction = func() {
				os.Remove(lockFilePath)
			}
			return unlockFunction, nil
		}

		// Check if timeout exceeded
		elapsedMilliseconds := time.Now().UnixMilli() - startTimeMilliseconds
		if elapsedMilliseconds >= timeoutMilliseconds {
			return nil, fmt.Errorf("failed to acquire lock after %d seconds: lock file exists at %s", lockAcquisitionTimeoutSeconds, lockFilePath)
		}

		// Check if lock file exists but process might be dead (stale lock)
		if fileInfo, statError := os.Stat(lockFilePath); statError == nil {
			// Check if lock file is older than timeout duration (potential stale lock)
			fileAgeMilliseconds := time.Since(fileInfo.ModTime()).Milliseconds()
			if fileAgeMilliseconds > timeoutMilliseconds*2 {
				// Attempt to remove stale lock
				if removeError := os.Remove(lockFilePath); removeError == nil {
					// Continue to next iteration to acquire lock
					continue
				}
			}
		}

		// Wait before retrying
		time.Sleep(pollingIntervalDuration)
	}
}

// atomicWriteToFile writes data to a file atomically using write-to-temp-then-rename pattern
func (service *ChangelistService) atomicWriteToFile(filePath string, dataBytes []byte) error {
	// Create temporary file in same directory
	temporaryFilePath := filePath + temporaryFileSuffix

	// Write to temporary file
	temporaryFile, createError := os.OpenFile(temporaryFilePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, filePermissionsData)
	if createError != nil {
		return fmt.Errorf("failed to create temporary file: %w", createError)
	}

	// Ensure cleanup on error
	defer func() {
		if temporaryFile != nil {
			temporaryFile.Close()
			// Clean up temp file if it still exists
			os.Remove(temporaryFilePath)
		}
	}()

	// Write data
	if _, writeError := temporaryFile.Write(dataBytes); writeError != nil {
		return fmt.Errorf("failed to write to temporary file: %w", writeError)
	}

	// Sync to ensure data is written to disk
	if syncError := temporaryFile.Sync(); syncError != nil {
		return fmt.Errorf("failed to sync temporary file: %w", syncError)
	}

	// Close temporary file
	if closeError := temporaryFile.Close(); closeError != nil {
		return fmt.Errorf("failed to close temporary file: %w", closeError)
	}
	temporaryFile = nil // Prevent defer cleanup

	// Atomically rename temporary file to target file
	if renameError := os.Rename(temporaryFilePath, filePath); renameError != nil {
		return fmt.Errorf("failed to rename temporary file: %w", renameError)
	}

	return nil
}

// loadChangelistConfiguration loads the changelist configuration from disk
func (service *ChangelistService) loadChangelistConfiguration(repositoryPath string) (*models.ChangelistConfiguration, error) {
	configurationFilePath := service.getChangelistConfigurationFilePath(repositoryPath)

	// Check if file exists
	if _, statError := os.Stat(configurationFilePath); os.IsNotExist(statError) {
		// Return empty configuration with default values
		return &models.ChangelistConfiguration{
			SchemaVersion:  models.ChangelistSchemaVersion,
			CustomGroups:   []models.Changelist{},
			LastSavedAt:    time.Now(),
			RepositoryPath: repositoryPath,
		}, nil
	}

	// Read file
	fileDataBytes, readError := os.ReadFile(configurationFilePath)
	if readError != nil {
		return nil, fmt.Errorf("failed to read changelist configuration: %w", readError)
	}

	// Parse JSON
	var configuration models.ChangelistConfiguration
	if unmarshalError := json.Unmarshal(fileDataBytes, &configuration); unmarshalError != nil {
		return nil, fmt.Errorf("failed to parse changelist configuration JSON: %w", unmarshalError)
	}

	// Validate schema version
	if configuration.SchemaVersion != models.ChangelistSchemaVersion {
		return nil, fmt.Errorf("unsupported changelist schema version %d, expected %d", configuration.SchemaVersion, models.ChangelistSchemaVersion)
	}

	return &configuration, nil
}

// saveChangelistConfiguration saves the changelist configuration to disk atomically
func (service *ChangelistService) saveChangelistConfiguration(repositoryPath string, configuration *models.ChangelistConfiguration) error {
	// Update timestamps
	configuration.LastSavedAt = time.Now()
	configuration.RepositoryPath = repositoryPath
	configuration.SchemaVersion = models.ChangelistSchemaVersion

	// Acquire lock
	unlockFunction, lockError := service.acquireChangelistConfigurationLock(repositoryPath)
	if lockError != nil {
		return lockError
	}
	defer unlockFunction()

	// Marshal to JSON with pretty printing
	jsonDataBytes, marshalError := json.MarshalIndent(configuration, "", "  ")
	if marshalError != nil {
		return fmt.Errorf("failed to marshal changelist configuration to JSON: %w", marshalError)
	}

	// Write atomically
	configurationFilePath := service.getChangelistConfigurationFilePath(repositoryPath)
	if writeError := service.atomicWriteToFile(configurationFilePath, jsonDataBytes); writeError != nil {
		return fmt.Errorf("failed to write changelist configuration: %w", writeError)
	}

	return nil
}

// Helper functions for path construction

func (service *ChangelistService) getChangelistDirectoryPath(repositoryPath string) string {
	return filepath.Join(repositoryPath, changelistDirectoryName)
}

func (service *ChangelistService) getChangelistConfigurationFilePath(repositoryPath string) string {
	return filepath.Join(service.getChangelistDirectoryPath(repositoryPath), changelistConfigurationFileName)
}

func (service *ChangelistService) getChangelistLockFilePath(repositoryPath string) string {
	return filepath.Join(service.getChangelistDirectoryPath(repositoryPath), changelistLockFileName)
}

// Validation and helper functions

func normalizeFilePath(filePath string) string {
	// Convert to forward slashes (POSIX style)
	normalizedPath := filepath.ToSlash(filePath)
	// Trim leading/trailing slashes
	normalizedPath = strings.Trim(normalizedPath, "/")
	return normalizedPath
}

func validateGroupName(groupName string) error {
	// Trim whitespace
	trimmedName := strings.TrimSpace(groupName)

	// Check if empty
	if len(trimmedName) < minimumGroupNameLength {
		return fmt.Errorf("group name must not be empty")
	}

	// Check length
	if len(trimmedName) > maximumGroupNameLength {
		return fmt.Errorf("group name must not exceed %d characters", maximumGroupNameLength)
	}

	// Check reserved names
	if reservedGroupNames[strings.ToLower(trimmedName)] {
		return fmt.Errorf("group name '%s' is reserved and cannot be used", trimmedName)
	}

	return nil
}

func validateFilePath(filePath string) error {
	// Check if absolute path
	if filepath.IsAbs(filePath) {
		return fmt.Errorf("file path must be relative to repository root, got absolute path: %s", filePath)
	}

	// Check for path traversal attempts
	if strings.Contains(filePath, "..") {
		return fmt.Errorf("file path must not contain '..' (path traversal): %s", filePath)
	}

	return nil
}

func (service *ChangelistService) findGroupByIdentifier(groups []models.Changelist, groupIdentifier string) (*models.Changelist, int) {
	for index, group := range groups {
		if group.IdentifierValue == groupIdentifier {
			return &groups[index], index
		}
	}
	return nil, -1
}

func (service *ChangelistService) isGroupNameUnique(groups []models.Changelist, groupName string, excludeIdentifier string) bool {
	for _, group := range groups {
		if group.GroupName == groupName && group.IdentifierValue != excludeIdentifier {
			return false
		}
	}
	return true
}

// CRUD Operations

// CreateChangelistGroup creates a new custom changelist group
func (service *ChangelistService) CreateChangelistGroup(repositoryPath string, groupName string) (*models.Changelist, error) {
	// Validate group name
	if validationError := validateGroupName(groupName); validationError != nil {
		return nil, validationError
	}

	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return nil, fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	// Check name uniqueness
	if !service.isGroupNameUnique(configuration.CustomGroups, strings.TrimSpace(groupName), "") {
		return nil, fmt.Errorf("group name '%s' already exists", strings.TrimSpace(groupName))
	}

	// Create new group
	currentTime := time.Now()
	newGroup := models.Changelist{
		IdentifierValue:    uuid.New().String(),
		GroupName:          strings.TrimSpace(groupName),
		GroupType:          models.ChangelistTypeCustom,
		CreatedAtTimestamp: currentTime,
		UpdatedAtTimestamp: currentTime,
		FileItems:          []models.ChangelistItem{},
		IsSystemGenerated:  false,
		OrderIndex:         len(configuration.CustomGroups),
	}

	// Add to configuration
	configuration.CustomGroups = append(configuration.CustomGroups, newGroup)

	// Save configuration
	if saveError := service.saveChangelistConfiguration(repositoryPath, configuration); saveError != nil {
		return nil, fmt.Errorf("failed to save changelist configuration: %w", saveError)
	}

	return &newGroup, nil
}

// RenameChangelistGroup renames an existing changelist group
func (service *ChangelistService) RenameChangelistGroup(repositoryPath string, groupIdentifier string, newGroupName string) error {
	// Validate new group name
	if validationError := validateGroupName(newGroupName); validationError != nil {
		return validationError
	}

	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	// Find group
	group, _ := service.findGroupByIdentifier(configuration.CustomGroups, groupIdentifier)
	if group == nil {
		return fmt.Errorf("group with identifier '%s' not found", groupIdentifier)
	}

	// Check name uniqueness (excluding current group)
	trimmedNewName := strings.TrimSpace(newGroupName)
	if !service.isGroupNameUnique(configuration.CustomGroups, trimmedNewName, groupIdentifier) {
		return fmt.Errorf("group name '%s' already exists", trimmedNewName)
	}

	// Update group
	group.GroupName = trimmedNewName
	group.UpdatedAtTimestamp = time.Now()

	// Save configuration
	if saveError := service.saveChangelistConfiguration(repositoryPath, configuration); saveError != nil {
		return fmt.Errorf("failed to save changelist configuration: %w", saveError)
	}

	return nil
}

// DeleteChangelistGroup removes a changelist group
func (service *ChangelistService) DeleteChangelistGroup(repositoryPath string, groupIdentifier string) error {
	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	// Find group index
	_, groupIndex := service.findGroupByIdentifier(configuration.CustomGroups, groupIdentifier)
	if groupIndex == -1 {
		return fmt.Errorf("group with identifier '%s' not found", groupIdentifier)
	}

	// Remove group from slice
	configuration.CustomGroups = append(configuration.CustomGroups[:groupIndex], configuration.CustomGroups[groupIndex+1:]...)

	// Save configuration
	if saveError := service.saveChangelistConfiguration(repositoryPath, configuration); saveError != nil {
		return fmt.Errorf("failed to save changelist configuration: %w", saveError)
	}

	return nil
}

// AddPathsToChangelistGroup adds file paths to a changelist group
func (service *ChangelistService) AddPathsToChangelistGroup(repositoryPath string, groupIdentifier string, filePathsToAdd []string) error {
	// Validate and normalize paths
	normalizedPaths := make([]string, 0, len(filePathsToAdd))
	for _, filePath := range filePathsToAdd {
		if validationError := validateFilePath(filePath); validationError != nil {
			return validationError
		}
		normalizedPaths = append(normalizedPaths, normalizeFilePath(filePath))
	}

	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	// Find group
	group, _ := service.findGroupByIdentifier(configuration.CustomGroups, groupIdentifier)
	if group == nil {
		return fmt.Errorf("group with identifier '%s' not found", groupIdentifier)
	}

	// Create map of existing paths for quick lookup
	existingPaths := make(map[string]bool)
	for _, item := range group.FileItems {
		existingPaths[item.FilePath] = true
	}

	// Add new paths (skip duplicates)
	currentTime := time.Now()
	for _, normalizedPath := range normalizedPaths {
		if !existingPaths[normalizedPath] {
			newItem := models.ChangelistItem{
				FilePath:              normalizedPath,
				AddedAtTimestamp:      currentTime,
				LastModifiedTimestamp: currentTime,
			}
			group.FileItems = append(group.FileItems, newItem)
		}
	}

	// Update group timestamp
	group.UpdatedAtTimestamp = currentTime

	// Save configuration
	if saveError := service.saveChangelistConfiguration(repositoryPath, configuration); saveError != nil {
		return fmt.Errorf("failed to save changelist configuration: %w", saveError)
	}

	return nil
}

// RemovePathsFromChangelistGroup removes file paths from a changelist group
func (service *ChangelistService) RemovePathsFromChangelistGroup(repositoryPath string, groupIdentifier string, filePathsToRemove []string) error {
	// Normalize paths for comparison
	normalizedPathsToRemove := make(map[string]bool)
	for _, filePath := range filePathsToRemove {
		normalizedPathsToRemove[normalizeFilePath(filePath)] = true
	}

	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	// Find group
	group, _ := service.findGroupByIdentifier(configuration.CustomGroups, groupIdentifier)
	if group == nil {
		return fmt.Errorf("group with identifier '%s' not found", groupIdentifier)
	}

	// Filter out paths to remove
	newItems := make([]models.ChangelistItem, 0, len(group.FileItems))
	for _, item := range group.FileItems {
		if !normalizedPathsToRemove[item.FilePath] {
			newItems = append(newItems, item)
		}
	}

	// Update group
	group.FileItems = newItems
	group.UpdatedAtTimestamp = time.Now()

	// Save configuration
	if saveError := service.saveChangelistConfiguration(repositoryPath, configuration); saveError != nil {
		return fmt.Errorf("failed to save changelist configuration: %w", saveError)
	}

	return nil
}

// MovePathsBetweenChangelistGroups moves file paths from one group to another atomically
func (service *ChangelistService) MovePathsBetweenChangelistGroups(repositoryPath string, sourceGroupIdentifier string, targetGroupIdentifier string, filePathsToMove []string) error {
	// Normalize paths
	normalizedPathsToMove := make(map[string]bool)
	for _, filePath := range filePathsToMove {
		normalizedPathsToMove[normalizeFilePath(filePath)] = true
	}

	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	// Find both groups
	sourceGroup, _ := service.findGroupByIdentifier(configuration.CustomGroups, sourceGroupIdentifier)
	if sourceGroup == nil {
		return fmt.Errorf("source group with identifier '%s' not found", sourceGroupIdentifier)
	}

	targetGroup, _ := service.findGroupByIdentifier(configuration.CustomGroups, targetGroupIdentifier)
	if targetGroup == nil {
		return fmt.Errorf("target group with identifier '%s' not found", targetGroupIdentifier)
	}

	// Collect items to move and items to keep in source
	itemsToMove := make([]models.ChangelistItem, 0)
	itemsToKeepInSource := make([]models.ChangelistItem, 0)

	for _, item := range sourceGroup.FileItems {
		if normalizedPathsToMove[item.FilePath] {
			itemsToMove = append(itemsToMove, item)
		} else {
			itemsToKeepInSource = append(itemsToKeepInSource, item)
		}
	}

	// Create map of existing paths in target for quick lookup
	existingPathsInTarget := make(map[string]bool)
	for _, item := range targetGroup.FileItems {
		existingPathsInTarget[item.FilePath] = true
	}

	// Add items to target (skip duplicates)
	currentTime := time.Now()
	for _, item := range itemsToMove {
		if !existingPathsInTarget[item.FilePath] {
			item.LastModifiedTimestamp = currentTime
			targetGroup.FileItems = append(targetGroup.FileItems, item)
		}
	}

	// Update source group
	sourceGroup.FileItems = itemsToKeepInSource
	sourceGroup.UpdatedAtTimestamp = currentTime

	// Update target group
	targetGroup.UpdatedAtTimestamp = currentTime

	// Save configuration (atomic - all or nothing)
	if saveError := service.saveChangelistConfiguration(repositoryPath, configuration); saveError != nil {
		return fmt.Errorf("failed to save changelist configuration: %w", saveError)
	}

	return nil
}

// GetAllChangelistGroups returns all custom changelist groups for a repository
func (service *ChangelistService) GetAllChangelistGroups(repositoryPath string) ([]models.Changelist, error) {
	// Load configuration
	configuration, loadError := service.loadChangelistConfiguration(repositoryPath)
	if loadError != nil {
		return nil, fmt.Errorf("failed to load changelist configuration: %w", loadError)
	}

	return configuration.CustomGroups, nil
}
