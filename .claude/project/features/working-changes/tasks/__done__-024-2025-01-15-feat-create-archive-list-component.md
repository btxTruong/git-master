# Task: Create Archive List Component

## Description
Create the archive list component that displays all archives for the current repository with sorting and filtering capabilities.

## Acceptance Criteria
- [x] Component created in `frontend/src/components/archive/ArchiveList.tsx`
- [x] Displays all archives using ArchiveItem
- [x] Sort by date, name, or file count
- [ ] Optional: filter by branch or date range
- [x] Empty state when no archives
- [x] Loading state while fetching
- [x] Virtualized for many archives

## Technical Considerations
- Use ArchiveItem for each archive
- Sort order toggleable
- Default sort: newest first
- Virtualization if >50 archives
- Smooth scrolling
- Keep component under 350 lines

## Dependencies
- Depends on: 014 Create archive Zustand store
- Depends on: 023 Create archive item component

## Estimated Effort
4 hours
