# Task: Create Archive Context Menu

## Description
Create context menu for archive actions: restore, create group, rename, delete, and export.

## Acceptance Criteria
- [x] Component created in `frontend/src/components/archive/ArchiveContextMenu.tsx`
- [x] Restore action with options dialog
- [x] Create Group from Archive action
- [x] Rename with validation
- [x] Delete with confirmation
- [x] Export as patch file action
- [x] All actions integrated with archiveStore

## Technical Considerations
- Radix UI DropdownMenu
- Restore options: 3-way, backup
- Rename validation (unique names)
- Delete confirmation dialog
- Export uses file save dialog
- Icons for each action
- Keep component under 350 lines

## Dependencies
- Depends on: 014 Create archive Zustand store
- Depends on: 023 Create archive item component

## Estimated Effort
4 hours
