# Task: Create File Context Menu Component

## Description
Create a reusable context menu component for file-level actions in changelists. This menu provides actions like revert, commit, diff, move to group, blame, and history.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/changelist/FileContextMenu.tsx`
- [ ] All file actions available (revert, commit, diff, move, blame, history, patch)
- [ ] Menu triggered on right-click
- [ ] Keyboard accessible
- [ ] Actions disabled based on file state
- [ ] Submenu for "Move to Group" with all groups
- [ ] Confirmation dialogs for destructive actions
- [ ] Integration with existing services

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
