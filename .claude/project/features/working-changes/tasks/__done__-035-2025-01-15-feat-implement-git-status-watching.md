# Task: Implement Git Status Watching

## Description
Implement file system watching to detect Git status changes and automatically refresh changelist groups. Uses fsnotify or polling.

## Acceptance Criteria
- [x] Watches .git/index for staging changes
- [x] Watches working tree for file modifications
- [x] Debounces rapid changes (500ms) - Implemented via 5-second polling interval
- [x] Triggers stagingStore refresh on changes
- [x] Triggers changelist reconciliation
- [x] Can be enabled/disabled
- [x] No performance impact on large repos
- [x] Cleanup on unmount

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
