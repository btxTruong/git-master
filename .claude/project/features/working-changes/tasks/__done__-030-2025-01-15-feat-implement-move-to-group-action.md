# Task: Implement Move to Group Action

## Description
Implement file movement between groups, handling both metadata-only moves (custom to custom) and Git operations (to/from tracked group).

## Acceptance Criteria
- [x] Move action shows submenu with all available groups
- [x] Custom to custom: metadata update only
- [N/A] Any to tracked: stages files (tracked group not implemented in current architecture)
- [N/A] Tracked to custom: unstages files (tracked group not implemented in current architecture)
- [x] Batch move support for multiple files
- [N/A] Confirmation for Git-affecting moves (not applicable without tracked group)
- [x] Toast feedback for operations
- [x] Error handling with rollback

## Technical Considerations
- Determine source and target group types
- If target is "tracked": stage files
- If source is "tracked" and target isn't: unstage files
- Otherwise: pure metadata operation
- Update pathToGroupIds index
- Optimistic UI update
- Extract complex logic to service method

## Dependencies
- Depends on: 013 Create changelist Zustand store
- Depends on: 017 Create file context menu component

## Estimated Effort
4 hours
