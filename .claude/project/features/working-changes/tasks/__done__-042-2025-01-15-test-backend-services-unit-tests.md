# Task: Backend Services Unit Tests

## Description
Create comprehensive unit tests for all backend services including changelistService, diffService, and extended stagingService methods.

## Acceptance Criteria
- [ ] Test JSON persistence and locking
- [ ] Test CRUD operations for groups
- [ ] Test path reconciliation logic
- [ ] Test archive creation and restoration
- [ ] Test diff generation for all file types
- [ ] Test error handling and edge cases
- [ ] Test concurrent access scenarios
- [ ] Achieve >80% code coverage

## Technical Considerations
- Use Go testing package
- Create test repository fixtures
- Mock Git command execution
- Test lock timeout scenarios
- Test atomic write failures
- Test path normalization edge cases
- Use table-driven tests where appropriate

## Dependencies
- Depends on: 002-010 (all backend implementation)

## Estimated Effort
8 hours
