# Task: Create Group Actions Toolbar

## Description
Create a toolbar component for global changelist actions like creating new groups and managing group display options.

## Acceptance Criteria
- [x] Toolbar component created in `frontend/src/components/changelist/GroupActionsToolbar.tsx`
- [x] "Create Group" button opens creation dialog
- [x] Group name input with validation
- [ ] Optional: filter/search groups
- [x] Optional: expand/collapse all groups
- [x] Consistent styling with existing toolbars

## Technical Considerations
- Position at top of changelist panel
- Create group dialog with validation
- Check for duplicate names
- Use existing Button component
- Icons from Lucide React
- Keep toolbar simple and uncluttered

## Dependencies
- Depends on: 013 Create changelist Zustand store

## Estimated Effort
3 hours
