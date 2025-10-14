# Task: Create Archive Zustand Store

## Description
Create a Zustand store for managing archive state including listing archives, selected archive, and archive operations (restore, rename, delete).

## Acceptance Criteria
- [ ] Store created in `frontend/src/stores/archiveStore.ts`
- [ ] State includes archives list, selected archive, loading/error states
- [ ] loadArchives fetches all archives for current repository
- [ ] restoreArchive handles restore with options
- [ ] Archive management operations (rename, delete) implemented
- [ ] Toast notifications for all operations
- [ ] Error handling with user-friendly messages
- [ ] Integration with changelistStore for group creation from archive

## Technical Considerations
- Similar structure to changelistStore
- Load archives when repository changes
- Cache archives list, refresh on changes
- Restore options: threeWay, backupTouchedPaths
- Coordinate with changelistStore for import
- Keep store focused on archive operations only

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 012 Create Wails API bindings

## Estimated Effort
4 hours
