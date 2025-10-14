# Task: Implement Commit from Group Action

## Description
Implement functionality to stage files from a group and open the commit dialog, enabling focused commits from specific changelists.

## Acceptance Criteria
- [x] Commit action available for files and groups
- [x] Stages selected files before commit
- [x] Opens existing commit dialog
- [x] Pre-fills commit message with group context (optional)
- [x] Option to commit only selected files vs entire group
- [x] Refreshes groups after successful commit
- [x] Error handling for staging failures
- [x] Maintains other groups unchanged

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
