# Task: Test Backend Line Revert Functionality

## Description
Thoroughly test the backend line revert service methods with various scenarios including edge cases, error conditions, and performance characteristics. Create a comprehensive test plan and document results to ensure reliability before frontend integration.

## Acceptance Criteria
- [ ] All backend methods tested with valid inputs
- [ ] Error handling tested with invalid inputs (bad paths, malformed patches, etc.)
- [ ] Edge cases tested (large files, binary files, permission errors)
- [ ] Performance measured for typical file sizes (up to 10,000 lines)
- [ ] Temporary file cleanup verified in all scenarios
- [ ] Concurrent revert operations tested
- [ ] Memory usage profiled during operations
- [ ] Test results documented with any issues found and resolved

## Technical Considerations
- Create sample Git repositories for testing
- Generate various diff scenarios programmatically
- Use Go's testing package for automated tests
- Manually test edge cases that are hard to automate
- Monitor temp directory for file leaks
- Use Git commands to verify patches applied correctly
- Test on different OS if possible (macOS, Linux, Windows)
- Reminder: Use full descriptive variable names in test code
- Reminder: No magic numbers in test assertions
- Reminder: Keep test files under 500 lines

## Dependencies
- Depends on: 001-2025-10-16-feat-backend-line-revert-service.md
- Blocks: 006, 014

## Estimated Effort
4-5 hours

## Implementation Notes

### Test Scenarios to Cover

**Valid Operations**:
1. Revert single added line
2. Revert single deleted line
3. Revert single modified line
4. Revert consecutive added lines (bulk)
5. Revert consecutive deleted lines (bulk)
6. Revert mixed change types (bulk)

**Edge Cases**:
1. Empty file
2. File with single line
3. File with 10,000+ lines
4. File with very long lines (1000+ characters)
5. File with Unicode characters
6. File with various line endings (LF, CRLF)
7. Binary file (should error gracefully)

**Error Conditions**:
1. Invalid file path
2. File not in repository
3. Malformed patch
4. Patch doesn't match current file state
5. Permission denied on file
6. Disk full
7. Concurrent modifications

**Performance Tests**:
1. Time to revert single line in 1,000 line file
2. Time to revert single line in 10,000 line file
3. Time to revert 100 consecutive lines
4. Memory usage during large bulk revert

### Testing Tools
- Go testing package
- Manual git commands for verification
- Shell scripts to generate test repositories
- Profiling tools (pprof) for performance analysis

### Documentation
Create test report documenting:
- Test cases executed
- Pass/fail results
- Performance metrics
- Issues found and resolutions
- Known limitations
