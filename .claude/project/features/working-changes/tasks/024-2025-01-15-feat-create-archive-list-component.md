# Task: Create Archive List Component

## Description
Create the archive list component that displays all archives for the current repository with sorting and filtering capabilities.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/archive/ArchiveList.tsx`
- [ ] Displays all archives using ArchiveItem
- [ ] Sort by date, name, or file count
- [ ] Optional: filter by branch or date range
- [ ] Empty state when no archives
- [ ] Loading state while fetching
- [ ] Virtualized for many archives

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
