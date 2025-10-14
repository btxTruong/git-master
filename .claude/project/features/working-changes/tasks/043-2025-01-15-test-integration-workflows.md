# Task: Integration Workflow Tests

## Description
Create integration tests that verify complete workflows from frontend to backend and back, ensuring all components work together correctly.

## Acceptance Criteria
- [ ] Test complete group creation workflow
- [ ] Test file movement between groups (including Git operations)
- [ ] Test archive creation and restoration roundtrip
- [ ] Test reconciliation after external Git changes
- [ ] Test concurrent operations
- [ ] Test error recovery workflows
- [ ] All critical paths covered

## Technical Considerations
- Test against real Git repository
- Use Wails test harness if available
- Test frontend store → API → backend → response
- Verify UI state after operations
- Test undo/rollback scenarios
- Clean up test data after runs

## Dependencies
- Depends on: All backend and frontend implementation tasks

## Estimated Effort
8 hours
