# Task: Create Archives View Tab

## Description
Create the Archives view that displays archived groups and provides management capabilities. This is Tab 2 of the Working Changes feature.

## Acceptance Criteria
- [x] View created in `frontend/src/views/ArchivesView.tsx`
- [x] Two-column layout: archive list (left) and diff preview (right)
- [x] Import patch button in toolbar
- [x] Loads archives on mount
- [x] Auto-refresh when archives change
- [x] Empty state for no archives
- [x] Overall loading and error states

## Technical Considerations
- Similar structure to ChangesView
- Use ArchiveList and ArchiveDiffPreview
- Toolbar with import action
- File picker for patch import
- Handle archive operations feedback
- Keep view under 400 lines

## Dependencies
- Depends on: 024 Create archive list component
- Depends on: 025 Create archive diff preview

## Estimated Effort
4 hours
