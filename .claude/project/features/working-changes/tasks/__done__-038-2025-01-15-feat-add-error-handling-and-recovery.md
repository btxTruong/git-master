# Task: Add Error Handling and Recovery

## Description
Implement comprehensive error handling with user-friendly messages and recovery suggestions for all operations.

## Acceptance Criteria
- [x] All errors displayed with actionable messages
- [x] Network/backend errors handled gracefully
- [x] Git command errors parsed and explained
- [x] Lock acquisition failures shown clearly
- [x] Recovery suggestions provided
- [x] Rollback for failed operations
- [x] Error boundaries around major sections
- [x] Logging for debugging

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
