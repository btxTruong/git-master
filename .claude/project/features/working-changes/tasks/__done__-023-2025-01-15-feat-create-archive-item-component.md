# Task: Create Archive Item Component

## Description
Create a component for displaying a single archive in the archives list, including metadata and context menu.

## Acceptance Criteria
- [x] Component created in `frontend/src/components/archive/ArchiveItem.tsx`
- [x] Displays archive name, date, branch, file count
- [x] Context menu for archive actions
- [x] Click to select archive
- [x] Visual selected state
- [x] Metadata formatted nicely (relative dates)
- [x] Icon based on archive age or size

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
