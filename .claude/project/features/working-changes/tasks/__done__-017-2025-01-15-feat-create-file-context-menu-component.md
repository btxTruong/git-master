# Task: Create File Context Menu Component

## Description
Create a reusable context menu component for file-level actions in changelists. This menu provides actions like revert, commit, diff, move to group, blame, and history.

## Acceptance Criteria
- [x] Component created in `frontend/src/components/changelist/FileContextMenu.tsx`
- [x] All file actions available (revert, commit, diff, move, blame, history, patch)
- [x] Menu triggered on right-click
- [x] Keyboard accessible
- [x] Actions disabled based on file state
- [x] Submenu for "Move to Group" with all groups
- [x] Confirmation dialogs for destructive actions
- [x] Integration with existing services

## Technical Considerations
- Use Radix UI DropdownMenu for context menu
- Position menu at mouse coordinates
- Use onContextMenu event
- Prevent default browser context menu
- Icons for each action
- Disabled state for unavailable actions
- Extract action handlers to hooks
- Keep component under 400 lines

## Dependencies
- Depends on: 013 Create changelist Zustand store
- Depends on: 015 Create derived group selectors

## Estimated Effort
5 hours
