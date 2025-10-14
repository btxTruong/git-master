package services

import (
	"context"
	"encoding/json"
	"fmt"
	"git-master/backend/models"
	"os"
	"path/filepath"
	"time"
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
