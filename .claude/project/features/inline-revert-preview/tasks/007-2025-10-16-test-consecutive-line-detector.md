# Task: Test Consecutive Line Detection Algorithm

## Description
Create comprehensive test suite for the consecutive line detection utility. Tests should cover all possible diff structures, edge cases, and performance characteristics. Verify algorithm correctness and efficiency with both unit and integration tests.

## Acceptance Criteria
- [ ] Unit tests cover all basic scenarios
- [ ] Edge case tests implemented and passing
- [ ] Performance tests verify O(n) complexity
- [ ] Tests use realistic diff data from actual Git repositories
- [ ] All change type combinations tested (add, delete, modify, mixed)
- [ ] Block boundary detection verified
- [ ] Test coverage above 95%
- [ ] All tests pass consistently
- [ ] Performance benchmarks documented

## Technical Considerations
- Generate diverse test data programmatically
- Use real diff data from project for integration tests
- Measure execution time with various array sizes
- Verify algorithm handles large datasets efficiently
- Test with different patterns (clustered changes, sparse changes)
- Reminder: Use full descriptive variable names in tests
- Reminder: No magic numbers in test assertions
- Reminder: Keep test files under 500 lines

## Dependencies
- Depends on: 006-2025-10-16-feat-consecutive-line-detector.md
- Blocks: 008, 011

## Estimated Effort
3-4 hours

## Implementation Notes

### Test File Location
Create: `/Users/truongbui/GolandProjects/git-master/frontend/src/utils/consecutiveLineDetector.test.ts`

### Test Categories

**Basic Functionality**:
- Detect single consecutive block (2 lines)
- Detect multiple separate blocks
- Detect large consecutive block (100+ lines)
- Handle mixed change types within block

**Edge Cases**:
- Empty array returns empty blocks
- All context lines returns empty blocks
- All changed lines returns single block
- Single changed line returns empty blocks
- Alternating changed and context lines
- Changes at start of file
- Changes at end of file

**Boundary Detection**:
- Context line correctly breaks blocks
- Multiple context lines between changes
- Single context line between changes
- Block starts at index 0
- Block ends at last index

**Performance Tests**:
- 1,000 lines processed in < 10ms
- 10,000 lines processed in < 50ms
- 100,000 lines processed in < 500ms
- Memory usage remains constant (no leaks)

**Integration with Real Data**:
- Test with actual diff from project repository
- Test with various file types (TypeScript, Go, Markdown)
- Test with different diff structures

### Test Data Generation
```typescript
function generateDiffLines(
  pattern: 'all-changed' | 'alternating' | 'clustered' | 'sparse',
  count: number
): DiffLine[]
```

### Performance Measurement
Use console.time() or performance.now() to measure execution time for different input sizes.

### Success Criteria
All tests pass, performance meets targets, and edge cases are handled correctly.
