# Task: Implement Backend Line Revert Service Methods

## Description
Implement new Go service methods in StagingService to support line-level revert operations. These methods will handle applying Git patches for single lines and line ranges, with proper validation and error handling. The backend will serve as the foundation for all inline revert functionality.

## Acceptance Criteria
- [ ] RevertLineChanges method implemented and accepts file path, line number, and patch string
- [ ] RevertLineRangeChanges method implemented for bulk line operations
- [ ] ValidateLineRevertPatch method implemented for patch validation before applying
- [ ] Temporary patch files are created and cleaned up properly
- [ ] Git apply command executes successfully with appropriate flags
- [ ] Error handling covers all edge cases (invalid paths, patch apply failures, permission errors)
- [ ] Method integrates cleanly with existing StagingService architecture
- [ ] Proper logging added for debugging patch operations

## Technical Considerations
- Use os.TempDir() for temporary patch file storage
- Generate unique filenames using time.Now().UnixNano() to prevent conflicts
- Use defer to ensure temporary files are always cleaned up
- Use git apply --whitespace=nowarn to handle whitespace variations
- Use git apply --check for dry-run validation before actual apply
- Return descriptive error messages that can be displayed to users
- Extract magic numbers to named constants (e.g., TEMP_PATCH_FILE_PREFIX)
- Keep methods focused and under 100 lines each
- Follow Go error handling best practices (wrap errors with context)
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: None (first task in sequence)
- Blocks: 002, 006, 014

## Estimated Effort
7-8 hours

## Implementation Notes

### File Location
`/Users/truongbui/GolandProjects/git-master/backend/services/staging_service.go`

### Method Signatures
```go
func (s *StagingService) RevertLineChanges(filePath string, lineNumber int, patch string) error
func (s *StagingService) RevertLineRangeChanges(filePath string, startLine int, endLine int, patch string) error
func (s *StagingService) ValidateLineRevertPatch(filePath string, patch string) error
```

### Testing Strategy
- Manually test with simple patch files
- Test with various file states (modified, added, deleted)
- Test error scenarios (invalid patch, file not found, permission denied)
- Verify temporary files are cleaned up even on errors

### Edge Cases to Handle
- File modified by external process during revert
- Invalid patch format
- Patch doesn't match current file state
- File path contains special characters
- Permission denied on file write
- Disk full errors
