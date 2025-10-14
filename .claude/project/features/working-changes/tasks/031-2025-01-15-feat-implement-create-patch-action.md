# Task: Implement Create Patch Action

## Description
Implement export functionality to create patch files from selected files or entire groups, similar to existing commit patch feature.

## Acceptance Criteria
- [ ] Create patch action for files and groups
- [ ] File save dialog for output location
- [ ] Generates valid Git patch format
- [ ] Includes file header information
- [ ] Works for staged, unstaged, and untracked files
- [ ] Binary file support
- [ ] Success feedback with file location
- [ ] Error handling for write failures

## Technical Considerations
- Reuse DiffService patch generation
- Similar to archive creation but user-chosen location
- Use Wails SelectSaveDirectory dialog
- Default filename: {group-name}-{date}.patch
- Validate write permissions
- Show file size in success message
- Extract to reusable utility

## Dependencies
- Depends on: 006 Create diff service for groups
- Depends on: 017 Create file context menu component

## Estimated Effort
3 hours
