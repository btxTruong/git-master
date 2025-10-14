# Task: Create Changes View Tab

## Description
Create the main Changes view that integrates the changelist panel and diff preview pane. This is Tab 1 of the Working Changes feature.

## Acceptance Criteria
- [x] View created in `frontend/src/views/ChangesView.tsx`
- [x] Two-column layout: changelist panel (left) and diff preview (right)
- [x] Resizable splitter between panels (optional for v1)
- [x] Loads changelists on mount
- [x] Auto-refresh on Git status changes
- [x] Keyboard shortcuts for common actions
- [x] Overall loading and error states

## Technical Considerations
- Replace existing placeholder ChangesView
- Use ChangelistPanel and DiffPreviewPane
- Subscribe to Git status events
- Trigger reconciliation on changes
- Handle loading states gracefully
- Use existing layout patterns
- Keep view under 400 lines

## Dependencies
- Depends on: 020 Create changelist panel component
- Depends on: 021 Create diff preview pane

## Estimated Effort
4 hours
