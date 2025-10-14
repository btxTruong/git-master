# Task: Add Error Handling and Recovery

## Description
Implement comprehensive error handling with user-friendly messages and recovery suggestions for all operations.

## Acceptance Criteria
- [ ] All errors displayed with actionable messages
- [ ] Network/backend errors handled gracefully
- [ ] Git command errors parsed and explained
- [ ] Lock acquisition failures shown clearly
- [ ] Recovery suggestions provided
- [ ] Rollback for failed operations
- [ ] Error boundaries around major sections
- [ ] Logging for debugging

## Technical Considerations
- Parse Git stderr for meaningful errors
- Map common errors to user-friendly messages
- Provide recovery actions (retry, undo)
- Use ErrorBoundary for component crashes
- Toast errors don't stack (dismiss previous)
- Log errors to console for debugging
- Extract error message mapping

## Dependencies
- Depends on: All store and component tasks

## Estimated Effort
4 hours
