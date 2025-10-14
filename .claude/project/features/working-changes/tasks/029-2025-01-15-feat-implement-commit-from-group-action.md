# Task: Implement Commit from Group Action

## Description
Implement functionality to stage files from a group and open the commit dialog, enabling focused commits from specific changelists.

## Acceptance Criteria
- [ ] Commit action available for files and groups
- [ ] Stages selected files before commit
- [ ] Opens existing commit dialog
- [ ] Pre-fills commit message with group context (optional)
- [ ] Option to commit only selected files vs entire group
- [ ] Refreshes groups after successful commit
- [ ] Error handling for staging failures
- [ ] Maintains other groups unchanged

## Technical Considerations
- Stage files using StagingService.StageMultipleFilePaths
- Use existing CommitDialog component
- Optional message template: "feat: {groupName}"
- Handle partial staging failures
- Update tracked group immediately
- Keep other custom groups intact
- Extract to custom hook

## Dependencies
- Depends on: 005 Extend staging service for batch operations
- Depends on: Existing CommitDialog component
- Depends on: 017 Create file context menu component

## Estimated Effort
3 hours
