# Task: Implement Revert File Action

## Description
Implement the revert file functionality that discards changes based on file state (tracked, unstaged, untracked).

## Acceptance Criteria
- [ ] Revert action available in file context menu
- [ ] Confirmation dialog for destructive action
- [ ] Handles staged files (restore --staged)
- [ ] Handles modified files (restore --source HEAD)
- [ ] Handles untracked files (delete with OS trash)
- [ ] Feedback via toast notifications
- [ ] Error handling with recovery suggestions
- [ ] Refreshes Git status after revert

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
