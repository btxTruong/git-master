# Task: Create Diff Service for Groups

## Description
Create a new DiffService that generates Git diffs for custom changelist groups. This service handles diff generation for different file states (staged, modified, untracked) and combines them appropriately.

Key functionality:
- Generate diffs for entire changelist groups
- Generate diffs for individual files
- Handle staged files (index vs HEAD)
- Handle modified tracked files (working tree vs HEAD)
- Handle untracked files (working tree vs /dev/null)
- Support binary files with --binary flag

## Acceptance Criteria
- [ ] GetChangelistGroupDiff generates complete diff for all files in group
- [ ] GetSingleFileDiff generates diff for individual file
- [ ] Staged files use `git diff --staged --binary`
- [ ] Modified files use `git diff --binary`
- [ ] Untracked files use `git diff --no-index --binary -- /dev/null <path>`
- [ ] Diff output includes proper headers for each file
- [ ] Binary files handled correctly with binary indicator
- [ ] Service respects Git config (quotepath, CRLF)

## Technical Considerations
- Use full descriptive function names (e.g., `GetChangelistGroupDiff`)
- Create new file: `backend/services/diff_service.go`
- Use `-c core.quotepath=false` to avoid octal escapes
- Use `--binary` flag for all diff operations
- Combine multiple diffs with double newline separator
- Set working directory to repository root for all Git commands
- Extract diff generation logic by file status type
- Keep service under 500 lines

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 003 Implement changelist CRUD operations

## Estimated Effort
4 hours
