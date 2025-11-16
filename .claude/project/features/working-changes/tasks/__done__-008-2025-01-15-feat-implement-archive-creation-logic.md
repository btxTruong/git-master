# Task: Implement Archive Creation Logic

## Description
Implement the core archive creation functionality that generates Git patch files from changelist groups. This combines diffs from different file states into a single unified patch file with accompanying metadata.

## Acceptance Criteria
- [x] ArchiveChangelistGroup creates .diff and .meta.json files atomically
- [x] Handles staged, modified tracked, and untracked files correctly
- [x] Generates valid Git patches compatible with `git apply`
- [x] Metadata includes all required fields (branch, commit, paths, etc.)
- [x] Binary files included with --binary flag
- [x] Archive creation is atomic (both files or neither)
- [x] Proper error handling with cleanup on failure
- [x] Progress can be monitored for large archives

## Technical Considerations
- Use DiffService to generate individual file diffs
- Categorize files by status before generating patches
- Combine patches with double-newline separator
- Write .diff file first, then .meta.json
- Clean up .diff if .meta.json write fails
- Use atomic write pattern from persistence task
- Extract file categorization to helper function
- Limit memory usage for large archives

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 006 Create diff service for groups
- Depends on: 007 Implement archive directory management

## Estimated Effort
6 hours
