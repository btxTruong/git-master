# Task: Create Archive Diff Preview

## Description
Create a component for previewing diffs from archived patches without applying them. Reads and parses the .diff file for display.

## Acceptance Criteria
- [x] Component created in `frontend/src/components/archive/ArchiveDiffPreview.tsx`
- [x] Reads .diff file content
- [x] Parses and displays diff using existing viewer
- [x] Handles multi-file diffs
- [x] Shows file navigation for archives with many files
- [x] Loading and error states
- [x] Warning for very large diffs

## Technical Considerations
- Fetch .diff file content from backend
- Parse diff into structure for viewer
- Reuse existing DiffViewer components
- File-by-file navigation
- Warn if diff >1MB
- Cache loaded diffs
- Keep component under 350 lines

## Dependencies
- Depends on: Existing DiffViewer components
- Depends on: 012 Create Wails API bindings

## Estimated Effort
4 hours
