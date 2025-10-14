# Task: Create Changelist Panel Component

## Description
Create the main changelist panel that displays all groups (tracked, untracked, custom) and coordinates group and file interactions.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/changelist/ChangelistPanel.tsx`
- [ ] Displays tracked group first, then untracked, then custom groups
- [ ] File selection synchronized across groups
- [ ] Group expansion state managed
- [ ] Virtualized list for many groups
- [ ] Smooth scrolling and interactions
- [ ] Empty state when no changes

## Technical Considerations
- Use ChangelistGroup component for each group
- Derived groups from selectors
- Custom groups from changelistStore
- Pass callbacks for file/group actions
- Manage UI state (expanded, selected)
- Use @tanstack/react-virtual if needed
- Keep panel under 400 lines

## Dependencies
- Depends on: 013 Create changelist Zustand store
- Depends on: 015 Create derived group selectors
- Depends on: 016 Create changelist group component

## Estimated Effort
5 hours
