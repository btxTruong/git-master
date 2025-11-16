# Task: Implement File History Integration

## Description
Integrate file history functionality into context menu, showing commit history for specific files.

## Acceptance Criteria
- [x] History action in file context menu
- [x] Shows commit list filtered to file path
- [x] Displays commit hash, message, author, date
- [x] Click commit to view diff for that file
- [x] Handles file renames correctly
- [x] Empty state for new files
- [x] Loading and error states

## Technical Considerations
- Use existing CommitService.GetCommits with file path filter
- Git command: `git log --follow -- <path>`
- --follow tracks renames
- Reuse existing commit list UI patterns
- Open commit detail on selection
- Filter to show only changes to this file
- May need modal or side panel

## Dependencies
- Depends on: 017 Create file context menu component
- Depends on: Existing CommitService

## Estimated Effort
4 hours
