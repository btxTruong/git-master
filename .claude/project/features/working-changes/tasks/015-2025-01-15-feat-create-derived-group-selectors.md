# Task: Create Derived Group Selectors

## Description
Create selector functions that derive "tracked" and "untracked" groups from the existing stagingStore. These selectors bridge the staging store with the changelist system.

## Acceptance Criteria
- [ ] selectTrackedGroup selector returns group from staged files
- [ ] selectUntrackedGroup selector returns group from untracked files
- [ ] Selectors return proper Changelist structure
- [ ] Selectors memoized for performance
- [ ] Integration with existing stagingStore seamless
- [ ] No duplication of file data
- [ ] Selectors update automatically when stagingStore changes

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
