# Task: Create Archive Item Component

## Description
Create a component for displaying a single archive in the archives list, including metadata and context menu.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/archive/ArchiveItem.tsx`
- [ ] Displays archive name, date, branch, file count
- [ ] Context menu for archive actions
- [ ] Click to select archive
- [ ] Visual selected state
- [ ] Metadata formatted nicely (relative dates)
- [ ] Icon based on archive age or size

## Technical Considerations
- Props: archive, isSelected, onSelect, onAction
- Use date-fns for date formatting
- Context menu: restore, diff, rename, delete, export
- Visual hierarchy for metadata
- Hover states for interactivity
- Keep component under 250 lines

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 014 Create archive Zustand store

## Estimated Effort
3 hours
