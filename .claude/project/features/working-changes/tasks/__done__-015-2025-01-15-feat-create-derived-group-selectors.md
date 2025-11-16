# Task: Create Derived Group Selectors

## Description
Create selector functions that derive "tracked" and "untracked" groups from the existing stagingStore. These selectors bridge the staging store with the changelist system.

## Acceptance Criteria
- [x] selectTrackedGroup selector returns group from staged files
- [x] selectUntrackedGroup selector returns group from untracked files
- [x] Selectors return proper Changelist structure
- [x] Selectors memoized for performance
- [x] Integration with existing stagingStore seamless
- [x] No duplication of file data
- [x] Selectors update automatically when stagingStore changes

## Technical Considerations
- Create in `frontend/src/stores/selectors/changelistSelectors.ts`
- Use Zustand selectors pattern
- Map FileStatus to ChangelistItem
- Return consistent structure with custom groups
- Consider memoization if performance needed
- Keep selectors pure functions
- Document selector behavior clearly

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: Existing stagingStore

## Estimated Effort
2 hours
