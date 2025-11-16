# Task: Implement Path Reconciliation Logic

## Description
Implement logic to reconcile changelist file paths with Git repository state. This handles renamed files, deleted files, and ensures changelist groups stay synchronized with the actual working tree state.

Key responsibilities:
- Detect renamed files using Git porcelain v2 status
- Update path mappings in changelists after renames
- Mark deleted files as "missing" rather than removing them
- Handle file restorations (missing → present)
- Provide cleanup function for missing files

## Acceptance Criteria
- [x] ReconcileChangelistsWithGitStatus processes Git status and updates groups
- [x] Renamed files update paths in all affected groups
- [x] Deleted files marked as missing with special indicator
- [x] Missing files can be bulk-removed via cleanup function
- [x] Function detects and processes porcelain v2 rename entries (status "R")
- [x] Path mappings updated atomically with lock protection
- [x] Reconciliation preserves file tracked snapshot data
- [x] Function handles multiple renames in single batch

## Technical Considerations
- Use full descriptive function names (e.g., `reconcileChangelistsWithGitRepositoryStatus`)
- Parse Git porcelain v2 format for rename detection
- Rename format: `2 R<similarity> <path> <originalPath>`
- Process renames before other status updates
- Maintain bidirectional path mapping for efficient lookups
- Mark missing files with special status in TrackedSnapshot
- Keep files in groups even when deleted for archive purposes
- Extract parsing logic to separate helper functions

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 002 Implement JSON persistence with locking
- Depends on: 003 Implement changelist CRUD operations

## Estimated Effort
4 hours

## Implementation Notes

### Service Methods to Implement
```go
func (service *ChangelistService) ReconcileChangelistsWithGitRepositoryStatus(repositoryPath string, gitStatusOutput string) error

func (service *ChangelistService) RemoveMissingFilesFromAllGroups(repositoryPath string) (removedCount int, error error)

func (service *ChangelistService) parseGitPorcelainStatusForRenames(statusOutput string) []FileRenameInfo

func (service *ChangelistService) updatePathInAllGroups(repositoryPath string, oldPath string, newPath string) error
```

### Git Porcelain v2 Format
```
# Ordinary changed entries
1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>

# Renamed entries
2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><score> <path><sep><origPath>

# Untracked entries
? <path>
```

### Rename Handling Algorithm
1. Parse status output for rename entries (starts with "2")
2. Extract original path and new path
3. For each changelist group:
   - Find items with original path
   - Update path to new path
   - Preserve tracked snapshot and notes
4. Save updated configuration

### Missing File Handling
- Add `isMissing` boolean to TrackedSnapshot
- Set to true when file no longer exists in working tree
- Display with special icon/indicator in UI
- Exclude from certain operations (e.g., diff)
- Include in archives (as deletion hunks)

### Helper Structures
```go
type FileRenameInfo struct {
    originalFilePath string
    newFilePath      string
    similarityScore  int
}
```
