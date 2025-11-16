# Task: Implement Archive Management Operations

## Description
Implement operations for managing archives: listing, renaming, deleting, and retrieving archive metadata. These provide the backend API for the Archives tab UI.

## Acceptance Criteria
- [x] ListAllArchivesForRepository returns all archives with metadata
- [x] GetArchiveMetadata reads and parses .meta.json file
- [x] RenameArchive renames both .diff and .meta.json atomically
- [x] DeleteArchive removes both files atomically
- [x] Operations validate archive existence before proceeding
- [x] Rename handles name conflicts (prevents overwrite)
- [x] Metadata parsing handles missing or corrupt files gracefully
- [x] All operations return detailed errors

## Technical Considerations
- List archives by scanning directory for .diff files
- Match each .diff with its .meta.json
- Rename both files in transaction (rename back on failure)
- Delete both files even if one is missing
- Validate archive names before rename
- Use same sanitization as archive creation
- Extract metadata parsing to reusable function
- Cache archive list for performance

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 007 Implement archive directory management

## Estimated Effort
4 hours
