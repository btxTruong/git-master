# Task: Implement Revert File Action

## Description
Implement the revert file functionality that discards changes based on file state (tracked, unstaged, untracked).

## Acceptance Criteria
- [x] Revert action available in file context menu
- [x] Confirmation dialog for destructive action
- [x] Handles staged files (restore --staged)
- [x] Handles modified files (restore --source HEAD)
- [x] Handles untracked files (delete with OS trash)
- [x] Feedback via toast notifications
- [x] Error handling with recovery suggestions
- [x] Refreshes Git status after revert

## Technical Considerations
- Use extended StagingService.RevertFileChanges
- Different commands per file state
- Confirmation with file name and change type
- OS trash integration if available
- Update UI optimistically
- Rollback on error
- Extract to custom hook

## Dependencies
- Depends on: 005 Extend staging service for batch operations
- Depends on: 017 Create file context menu component

## Estimated Effort
3 hours
