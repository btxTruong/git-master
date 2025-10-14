# Task: Implement JSON Persistence with Locking

## Description
Implement atomic JSON file persistence for changelist configuration with lock file mechanism to prevent concurrent access issues. This ensures data integrity when multiple operations or instances attempt to modify the changelist configuration.

Key components:
- Atomic write operations (write to temp, sync, rename)
- Lock file acquisition with timeout
- JSON serialization/deserialization
- Directory structure creation for `.git-master` folder

## Acceptance Criteria
- [ ] Lock file mechanism implemented with 3-second timeout and 50ms polling
- [ ] Atomic write function writes to temp file, syncs, then renames
- [ ] Lock automatically released via defer pattern
- [ ] JSON marshaling/unmarshaling with proper error handling
- [ ] Directory creation handles missing `.git-master` folder
- [ ] Lock acquisition failure returns descriptive error
- [ ] Concurrent access attempts queue properly with timeout
- [ ] File permissions set correctly (0644 for data, 0755 for directories)

## Technical Considerations
- Use full descriptive function names (e.g., `acquireChangelistConfigurationLock`)
- Extract timeout duration as named constant: `const lockAcquisitionTimeoutSeconds = 3`
- Extract polling interval as named constant: `const lockPollingIntervalMilliseconds = 50`
- Use `os.OpenFile` with `O_CREATE|O_EXCL` for atomic lock creation
- Always use `defer` to ensure lock cleanup
- Handle case where lock file exists but process is dead (stale lock)
- Use `filepath.Join` for cross-platform path construction
- Implement cleanup of temp files on errors

## Dependencies
- Depends on: 001 Create changelist models and types

## Estimated Effort
4 hours

## Implementation Notes

### File Location
- Service: `backend/services/changelist_service.go`
- Helper functions can be in same file initially

### Lock File Path
- Location: `{repoPath}/.git-master/changelists.lock`
- Format: Empty file, existence indicates lock

### JSON File Path
- Location: `{repoPath}/.git-master/changelists.json`
- Format: Pretty-printed JSON with 2-space indentation

### Key Functions to Implement
```go
func (service *ChangelistService) acquireChangelistConfigurationLock(repositoryPath string) (unlockFunction func(), errorResult error)

func (service *ChangelistService) atomicWriteToFile(filePath string, dataBytes []byte) error

func (service *ChangelistService) loadChangelistConfiguration(repositoryPath string) (*ChangelistConfig, error)

func (service *ChangelistService) saveChangelistConfiguration(repositoryPath string, configuration *ChangelistConfig) error
```

### Error Handling
- Lock timeout: Return descriptive error with timeout duration
- File write errors: Clean up temp files before returning error
- JSON marshal errors: Include validation details in error message
- Missing directory: Attempt to create, return error if creation fails
