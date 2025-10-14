# Task: Implement Move to Group Action

## Description
Implement file movement between groups, handling both metadata-only moves (custom to custom) and Git operations (to/from tracked group).

## Acceptance Criteria
- [ ] Move action shows submenu with all available groups
- [ ] Custom to custom: metadata update only
- [ ] Any to tracked: stages files
- [ ] Tracked to custom: unstages files
- [ ] Batch move support for multiple files
- [ ] Confirmation for Git-affecting moves
- [ ] Toast feedback for operations
- [ ] Error handling with rollback

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
