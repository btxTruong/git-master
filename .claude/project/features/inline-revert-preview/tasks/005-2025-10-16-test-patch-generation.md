# Task: Test Patch Generation Utility

## Description
Create comprehensive tests for the patch generation utilities to ensure they produce valid Git patches that can be successfully applied. Test all change types, edge cases, and validate patches using actual Git commands.

## Acceptance Criteria
- [ ] Unit tests cover all change types (add, delete, modify)
- [ ] Tests verify patch format correctness (headers, line numbers, prefixes)
- [ ] Edge cases tested (empty lines, special characters, long lines)
- [ ] Integration tests validate patches with git apply --check
- [ ] Performance tests for large line ranges
- [ ] Test coverage above 90%
- [ ] All tests pass consistently
- [ ] Test results documented

## Technical Considerations
- Use Jest or similar testing framework
- Create sample diff data for various scenarios
- Use git apply --check to validate generated patches
- Mock file system operations where needed
- Test with real-world diff examples from project
- Measure patch generation performance
- Reminder: Use full descriptive variable names in tests
- Reminder: No magic numbers in test assertions
- Reminder: Keep test files under 500 lines

## Dependencies
- Depends on: 004-2025-10-16-feat-patch-generation-utility.md
- Blocks: 006, 014

## Estimated Effort
3-4 hours

## Implementation Notes

### Test File Location
Create: `/Users/truongbui/GolandProjects/git-master/frontend/src/utils/patchGenerator.test.ts`

### Test Cases to Implement

**Basic Functionality**:
- Generate patch for single added line
- Generate patch for single deleted line
- Generate patch for single modified line
- Generate bulk patch for consecutive additions
- Generate bulk patch for consecutive deletions
- Generate bulk patch for mixed changes

**Edge Cases**:
- Empty line
- Line with only whitespace
- Very long line (1000+ characters)
- File path with spaces
- File path with special characters
- First line of file
- Last line of file
- Single line file

**Format Validation**:
- Patch header format correct
- Line numbers calculated correctly
- Prefixes (+, -, space) used correctly
- Context lines included when needed

**Integration with Git**:
- Generated patches pass git apply --check
- Patches apply cleanly to test files
- File state after patch matches expected state

### Testing Tools
- Jest for unit tests
- exec for running git commands
- Temporary file system for integration tests

### Success Criteria
All tests pass with consistent results, patches validate with Git, and edge cases are handled gracefully.
