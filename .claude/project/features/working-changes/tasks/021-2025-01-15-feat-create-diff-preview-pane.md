# Task: Create Diff Preview Pane

## Description
Create a pane that displays file diffs when a file is selected from any changelist group. Reuses existing diff viewer components.

## Acceptance Criteria
- [ ] Component created in `frontend/src/components/changelist/DiffPreviewPane.tsx`
- [ ] Displays diff for selected file
- [ ] Lazy loads diff on file selection
- [ ] Shows loading state while fetching
- [ ] Error state for diff failures
- [ ] Empty state when no file selected
- [ ] Reuses existing DiffViewer component

## Technical Considerations
- Fetch diff from backend on file select
- Determine diff source (staged vs working)
- Cache diffs for performance
- Clear cache on Git status changes
- Use existing VirtualizedUnifiedDiff or VirtualizedSplitDiff
- Handle binary files gracefully
- Keep component under 300 lines

## Dependencies
- Depends on: Existing DiffViewer components
- Depends on: 012 Create Wails API bindings

## Estimated Effort
4 hours
