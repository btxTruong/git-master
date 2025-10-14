# Task: Implement Import Patch Action

## Description
Implement patch import functionality that can either apply patches directly or create changelist groups from patch contents.

## Acceptance Criteria
- [ ] Import action in Archives view toolbar
- [ ] File picker for .patch or .diff files
- [ ] Two options: Apply Now or Create Group
- [ ] Apply Now: uses restore logic with options
- [ ] Create Group: parses patch and creates group with paths
- [ ] Validation of patch format
- [ ] Preview before apply (optional)
- [ ] Error handling for invalid patches

## Technical Considerations
- Use Wails OpenFileDialog
- Validate patch with `git apply --check`
- Parse patch to extract file paths
- Create Group option: non-destructive
- Apply option: preflight + backup
- Show summary of changes before apply
- Extract patch parsing logic

## Dependencies
- Depends on: 009 Implement archive restoration logic
- Depends on: 027 Create archives view tab

## Estimated Effort
4 hours
