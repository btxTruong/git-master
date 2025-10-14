# Task: Create Changelist Models and Types

## Description
Create the core data models and types for the changelist system in both Go backend and TypeScript frontend. These models will serve as the foundation for all changelist operations.

This task establishes the data structures for:
- Changelist groups (custom, tracked, untracked)
- Changelist items (files within groups)
- Archive metadata
- Configuration structures

## Acceptance Criteria
- [x] Go models created in `backend/models/changelist.go` with proper JSON tags
- [x] TypeScript types created in `frontend/src/types/changelist.ts`
- [x] All structs have complete JSON serialization support
- [x] Type safety enforced between Go and TypeScript
- [x] Constants defined for changelist types and statuses
- [x] Models support versioning for future schema changes
- [x] Archive metadata structures defined
- [x] All fields have descriptive names (no abbreviations)

## Technical Considerations
- Use full descriptive variable and field names (e.g., `createdAtTimestamp` not `createdAt`)
- Define magic numbers as named constants (e.g., `const maximumGroupNameLength = 100`)
- Ensure Go struct tags match TypeScript interface property names exactly
- Use ISO 8601 timestamp format for all time fields
- Include optional fields for future extensibility (tracked snapshot, notes)
- Ensure all models can be safely serialized to JSON
- Version number in configuration for schema migrations

## Dependencies
- None (first task in the implementation)

## Estimated Effort
3 hours

## Implementation Notes

### Go Models Location
- File: `backend/models/changelist.go`
- Package: `models`

### TypeScript Types Location
- File: `frontend/src/types/changelist.ts`

### Key Fields to Include
- Changelist: id, name, type, createdAt, updatedAt, items
- ChangelistItem: path, trackedSnapshot, notes
- ChangelistConfig: version, groups
- ArchiveMetadata: all archive context information

### Validation Rules
- Group names: 1-100 characters, no leading/trailing whitespace
- Paths: POSIX-style normalized paths, relative to repository root
- Types: Enum restricted to "custom", "tracked", "untracked"
