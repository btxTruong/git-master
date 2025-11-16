# Task: Implement Auto-Reconciliation

## Description
Implement automatic reconciliation of changelist groups when Git status changes are detected. Handles renames, deletions, and new files.

## Acceptance Criteria
- [x] Reconciliation triggered on Git status events
- [x] Renames update paths in all groups
- [x] Deleted files marked as missing
- [x] New files can be auto-added to groups (optional)
- [x] Reconciliation atomic and fast (<100ms)
- [x] No user disruption during reconciliation
- [x] Error handling doesn't break UI

## Technical Considerations
- Subscribe to Git status change events
- Call backend ReconcileChangelistsWithGitRepositoryStatus
- Update frontend state from backend response
- Handle edge cases (mass renames, deletions)
- Debounce if called too frequently
- Silent updates (no toasts unless error)
- Extract to separate reconciliation manager

## Dependencies
- Depends on: 004 Implement path reconciliation logic
- Depends on: 035 Implement Git status watching

## Estimated Effort
4 hours
