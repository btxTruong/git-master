# Task: Create Group Context Menu Component

## Description
Create a context menu component for group-level actions including archive, commit all, rename, delete, and create patch.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/changelist/GroupContextMenu.tsx`
- [ ] All group actions available
- [ ] Disabled for default groups (tracked/untracked) appropriately
- [ ] Confirmation for delete with optional archive
- [ ] Rename inline or via dialog
- [ ] Archive name input dialog
- [ ] Integration with changelistStore actions

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
