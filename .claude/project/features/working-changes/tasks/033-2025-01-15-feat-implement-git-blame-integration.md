# Task: Implement Git Blame Integration

## Description
Integrate Git blame functionality into file context menu, showing line-by-line authorship information.

## Acceptance Criteria
- [ ] Blame action in file context menu
- [ ] Opens blame view/modal with file annotations
- [ ] Shows commit hash, author, date per line
- [ ] Click line to view commit details
- [ ] Handles files not in Git history
- [ ] Loading state during blame fetch
- [ ] Error handling for blame failures

## Technical Considerations
- Create new BlameService or extend existing service
- Use `git blame --line-porcelain` for detailed info
- Parse blame output into structured data
- Reuse or create BlameViewer component
- Handle new files (not in history)
- Cache blame results per file/commit
- Extract to separate feature if complex

## Dependencies
- Depends on: 017 Create file context menu component
- May need: New BlameService and BlameViewer components

## Estimated Effort
5 hours
