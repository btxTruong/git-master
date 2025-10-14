# Task: Create Changelist Group Component

## Description
Create the ChangelistGroup component that displays a single changelist group with its files. This component is reused for tracked, untracked, and custom groups.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/changelist/ChangelistGroup.tsx`
- [ ] Displays group name and file count
- [ ] Expand/collapse functionality
- [ ] Integrates FileTree for file display
- [ ] Visual distinction for group types (tracked/untracked/custom)
- [ ] Group action menu (edit, delete, archive)
- [ ] Loading state during operations
- [ ] Empty state when no files

## Technical Considerations
- Props: group, onFileSelect, onGroupAction
- Use existing FileTree component
- Headless UI disclosure for expand/collapse
- Context menu for group actions
- Icons: Lucide React
- Styling: Tailwind CSS matching existing patterns
- Full descriptive prop names
- Keep component under 300 lines

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: Existing FileTree component

## Estimated Effort
4 hours
