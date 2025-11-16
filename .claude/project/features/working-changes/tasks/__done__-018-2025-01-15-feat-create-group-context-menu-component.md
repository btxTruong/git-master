# Task: Create Group Context Menu Component

## Description
Create a context menu component for group-level actions including archive, commit all, rename, delete, and create patch.

## Acceptance Criteria
- [x] Component created in `frontend/src/components/changelist/GroupContextMenu.tsx`
- [x] All group actions available
- [x] Disabled for default groups (tracked/untracked) appropriately
- [x] Confirmation for delete with optional archive
- [x] Rename inline or via dialog
- [x] Archive name input dialog
- [x] Integration with changelistStore actions

## Technical Considerations
- Similar pattern to FileContextMenu
- Different actions for default vs custom groups
- Archive dialog with name validation
- Delete confirmation with checkbox for archive first
- Rename validation (unique names)
- Use existing dialog components
- Keep focused on group-level operations

## Dependencies
- Depends on: 013 Create changelist Zustand store
- Depends on: 016 Create changelist group component

## Estimated Effort
4 hours
