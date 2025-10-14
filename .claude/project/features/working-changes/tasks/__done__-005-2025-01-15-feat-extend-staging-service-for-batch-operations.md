# Task: Extend Staging Service for Batch Operations

## Description
Extend the existing `staging_service.go` to support batch operations needed for changelist functionality. Add methods to stage/unstage multiple files at once, get status for specific paths, and revert file changes.

New capabilities:
- Batch stage multiple file paths
- Batch unstage multiple file paths
- Get Git status for specific file subset
- Revert file changes (staged, unstaged, untracked)

## Acceptance Criteria
- [x] StageMultipleFilePaths stages all provided paths in single Git operation
- [x] UnstageMultipleFilePaths unstages all provided paths in single Git operation
- [x] GetStatusForSpecificFilePaths returns status for specified files only
- [x] RevertFileChanges handles tracked, untracked, and deleted files correctly
- [x] Batch operations maintain atomicity (all succeed or all fail)
- [x] Functions reuse existing Git executor patterns
- [x] Error messages indicate which files failed in batch operations
- [x] Status parsing reuses existing parseStatus logic

## Technical Considerations
- Use full descriptive function names (e.g., `StageMultipleFilePaths`, not `StageFiles`)
- Extract repeated Git command patterns to reduce duplication
- Use Git's ability to accept multiple paths in single command
- For staging: `git add path1 path2 path3`
- For unstaging: `git reset HEAD path1 path2 path3`
- For revert: `git restore --source HEAD -- path1 path2 path3`
- Handle empty path lists gracefully
- Validate all paths before executing Git command
- Keep function additions under 100 lines each

## Dependencies
- Depends on: Existing staging_service.go

## Estimated Effort
3 hours

## Implementation Notes

### File to Modify
- Location: `backend/services/staging_service.go`
- Extend existing StagingService struct

### Methods to Add
```go
func (service *StagingService) StageMultipleFilePaths(filePathsToStage []string) error

func (service *StagingService) UnstageMultipleFilePaths(filePathsToUnstage []string) error

func (service *StagingService) GetStatusForSpecificFilePaths(filePathsToQuery []string) ([]FileStatus, error)

func (service *StagingService) RevertFileChanges(filePath string, options RevertOptions) error
```

### RevertOptions Structure
```go
type RevertOptions struct {
    revertStagedChanges   bool // Revert staged changes
    revertUnstagedChanges bool // Revert working tree changes
    deleteUntrackedFiles  bool // Delete if untracked
}
```

### Git Commands
- Stage batch: `git add -- <path1> <path2> <path3>`
- Unstage batch: `git reset HEAD -- <path1> <path2> <path3>`
- Revert staged: `git restore --staged -- <path>`
- Revert unstaged: `git restore --source HEAD -- <path>`
- Delete untracked: `git clean -f -- <path>` or manual file deletion

### Error Handling
- Empty path list: Return nil (no-op)
- Invalid paths: Return error listing all invalid paths
- Git command failure: Return error with Git stderr output
- Partial failures: Consider all-or-nothing semantics vs partial success

### Integration Points
- Reuses existing Git executor from staging service
- Reuses parseStatus for status queries
- Maintains compatibility with existing StageFile/UnstageFile methods
