# Task: Implement Git Status Watching

## Description
Implement file system watching to detect Git status changes and automatically refresh changelist groups. Uses fsnotify or polling.

## Acceptance Criteria
- [ ] Watches .git/index for staging changes
- [ ] Watches working tree for file modifications
- [ ] Debounces rapid changes (500ms)
- [ ] Triggers stagingStore refresh on changes
- [ ] Triggers changelist reconciliation
- [ ] Can be enabled/disabled
- [ ] No performance impact on large repos
- [ ] Cleanup on unmount

## Technical Considerations
- Backend: Use fsnotify library (may need to add dependency)
- Alternative: Polling with configurable interval
- Watch .git/index file for staging changes
- Watch working tree (selective watching)
- Batch/debounce notifications
- Emit events via Wails EventsEmit
- Frontend subscribes to events
- Extract debounce duration as constant

## Dependencies
- Depends on: 013 Create changelist Zustand store
- Depends on: 015 Create derived group selectors

## Estimated Effort
5 hours
