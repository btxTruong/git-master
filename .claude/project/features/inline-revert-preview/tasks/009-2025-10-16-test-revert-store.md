# Task: Test Revert State Management Store

## Description
Create comprehensive tests for the revert Zustand store to ensure all state updates, actions, and selectors work correctly. Test state persistence, cache management, and integration with React components through hooks.

## Acceptance Criteria
- [ ] All actions tested with various inputs
- [ ] State updates verified for correctness
- [ ] Selectors tested with different state configurations
- [ ] History limit enforcement tested
- [ ] Cache cleanup tested
- [ ] Concurrent action handling tested
- [ ] Integration with React components tested
- [ ] Test coverage above 90%
- [ ] All tests pass consistently

## Technical Considerations
- Use @testing-library/react-hooks for hook testing
- Test state updates synchronously and asynchronously
- Verify immutability of state updates
- Test edge cases (empty state, max history, cache eviction)
- Mock console methods to suppress expected warnings
- Reminder: Use full descriptive variable names in tests
- Reminder: No magic numbers in test assertions
- Reminder: Keep test files under 500 lines

## Dependencies
- Depends on: 008-2025-10-16-feat-revert-store.md
- Blocks: 011, 014

## Estimated Effort
3-4 hours

## Implementation Notes

### Test File Location
Create: `/Users/truongbui/GolandProjects/git-master/frontend/src/stores/revertStore.test.ts`

### Test Categories

**Action Tests**:
- setHoveredLineIndex updates state correctly
- setConsecutiveBlocks adds to cache
- getConsecutiveBlocks retrieves correct blocks
- addPendingRevert adds operation ID
- removePendingRevert removes operation ID
- isPending returns correct boolean
- addToHistory appends operation
- addToHistory enforces max size limit
- clearHistory empties array
- getLastOperation returns most recent

**Selector Tests**:
- useIsLineHovered returns true when index matches
- useConsecutiveBlockForLine finds correct block
- Selectors update when state changes
- Selectors memoize correctly (no unnecessary re-renders)

**Edge Cases**:
- Adding duplicate pending operations
- Removing non-existent pending operation
- History at maximum size
- Empty cache lookup
- Invalid file keys

**Integration Tests**:
- Store works with React components
- Multiple components can access store simultaneously
- State updates trigger component re-renders
- Cleanup on unmount works correctly

### Testing Tools
- @testing-library/react-hooks for hook testing
- act() for state updates
- renderHook() for testing hooks in isolation

### Mock Data
Create factory functions for generating test data:
```typescript
function createMockConsecutiveBlock(startIndex: number, lineCount: number): ConsecutiveBlock;
function createMockRevertOperation(filePath: string): RevertOperation;
```

### Success Criteria
All store functionality works as expected, no memory leaks, and state updates are consistent and predictable.
