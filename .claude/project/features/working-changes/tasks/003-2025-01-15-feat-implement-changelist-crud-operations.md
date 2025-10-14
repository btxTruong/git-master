# Task: Implement Changelist CRUD Operations

## Description
Implement create, read, update, and delete operations for custom changelist groups. These operations form the core API for managing changelists and will be exposed to the frontend via Wails bindings.

Operations to implement:
- Create new custom group
- Rename existing group
- Delete group
- Add file paths to group
- Remove file paths from group
- Move paths between groups
- Get all groups for a repository

## Acceptance Criteria
- [ ] CreateChangelistGroup creates group with unique UUID and timestamp
- [ ] RenameChangelistGroup validates name uniqueness and updates timestamp
- [ ] DeleteChangelistGroup removes group and optionally archives first
- [ ] AddPathsToChangelistGroup adds paths without duplicates
- [ ] RemovePathsFromChangelistGroup removes specified paths
- [ ] MovePathsBetweenChangelistGroups handles cross-group transfers atomically
- [ ] All operations use lock mechanism for thread safety
- [ ] All operations return detailed errors on failure
- [ ] Group name validation enforced (1-100 chars, no reserved names)
- [ ] Path normalization applied (POSIX-style forward slashes)

## Technical Considerations
- Use full descriptive parameter names (e.g., `changelistGroupIdentifier`, `filePathsToAdd`)
- Extract validation rules as named constants (e.g., `const maximumGroupNameLength = 100`)
- Reserve group names: "tracked", "untracked", "default"
- Generate UUIDs using `github.com/google/uuid` (already in dependencies)
- Normalize all paths to POSIX style using `filepath.ToSlash`
- Update `updatedAt` timestamp on any modification
- Validate paths are relative to repository root
- Keep file under 500 lines; extract helpers if needed

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 002 Implement JSON persistence with locking

## Estimated Effort
5 hours

## Implementation Notes

### Service Methods to Implement
```go
func (service *ChangelistService) CreateChangelistGroup(repositoryPath string, groupName string) (*Changelist, error)

func (service *ChangelistService) RenameChangelistGroup(repositoryPath string, groupIdentifier string, newGroupName string) error

func (service *ChangelistService) DeleteChangelistGroup(repositoryPath string, groupIdentifier string) error

func (service *ChangelistService) AddPathsToChangelistGroup(repositoryPath string, groupIdentifier string, filePathsToAdd []string) error

func (service *ChangelistService) RemovePathsFromChangelistGroup(repositoryPath string, groupIdentifier string, filePathsToRemove []string) error

func (service *ChangelistService) MovePathsBetweenChangelistGroups(repositoryPath string, sourceGroupIdentifier string, targetGroupIdentifier string, filePathsToMove []string) error

func (service *ChangelistService) GetAllChangelistGroups(repositoryPath string) ([]Changelist, error)
```

### Validation Rules
- Group name must not be empty or only whitespace
- Group name must be <= 100 characters
- Group name must not be "tracked", "untracked", or "default"
- Group identifier must exist for update/delete operations
- Paths must not be absolute
- Paths must not contain ".." (path traversal)

### Path Normalization
```go
func normalizeFilePath(path string) string {
    // Convert to forward slashes
    normalized := filepath.ToSlash(path)
    // Trim leading/trailing slashes
    normalized = strings.Trim(normalized, "/")
    return normalized
}
```

### Atomic Operations
- Load configuration
- Acquire lock
- Perform modifications
- Save configuration
- Release lock (via defer)
- All or nothing semantics
