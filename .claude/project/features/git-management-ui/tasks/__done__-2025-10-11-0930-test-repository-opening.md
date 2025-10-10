# Test Repository Opening Flow

## Type
test

## Description
Manually test the complete repository opening workflow end-to-end, including folder selection, repository validation, loading commits, and error handling scenarios.

## Acceptance Criteria
- [ ] Can open OpenRepoDialog from AppHeader
- [ ] Directory picker dialog opens
- [ ] Can select a valid Git repository
- [ ] Repository name displays in AppHeader
- [ ] Current branch displays in AppHeader
- [ ] Recent repositories list updates
- [ ] Recent repositories persist after app restart
- [ ] Error shown for non-Git directories
- [ ] Error shown for invalid/corrupted repositories
- [ ] Loading state displays while opening
- [ ] Dialog closes automatically on success

## Technical Details

### Test Scenarios

**Scenario 1: Happy Path - Open Valid Repository**
1. Click "Open Repository" button in AppHeader
2. OpenRepoDialog appears
3. Click "Select Folder"
4. Native directory picker opens
5. Navigate to a Git repository (e.g., this project)
6. Select folder
7. Verify loading indicator shows
8. Verify dialog closes
9. Verify repository name appears in header
10. Verify current branch appears in header
11. Verify commits load in HistoryView

**Scenario 2: Error - Non-Git Directory**
1. Open OpenRepoDialog
2. Select a non-Git directory (e.g., Desktop)
3. Verify error toast shows: "Not a Git repository"
4. Verify dialog stays open
5. Verify can try again

**Scenario 3: Cancel Directory Picker**
1. Open OpenRepoDialog
2. Click "Select Folder"
3. Click "Cancel" in directory picker
4. Verify dialog stays open
5. Verify no error shown
6. Verify can close dialog with "Cancel" button

**Scenario 4: Recent Repositories Persistence**
1. Open repository A
2. Close application
3. Reopen application
4. Verify repository A is in recent list
5. Open repository B
6. Verify both A and B are in recent list
7. Verify most recent is shown first

**Scenario 5: Error - Repository with No Commits**
1. Create empty Git repo: `git init /tmp/empty-repo`
2. Open `/tmp/empty-repo`
3. Verify repository opens
4. Verify "No commits yet" empty state shown
5. Verify no errors

### Manual Test Checklist

- [ ] Test Scenario 1: Happy path works
- [ ] Test Scenario 2: Non-Git directory error
- [ ] Test Scenario 3: Cancel directory picker
- [ ] Test Scenario 4: Recent repos persistence
- [ ] Test Scenario 5: Empty repository
- [ ] Verify no console errors during any scenario
- [ ] Verify UI remains responsive during operations
- [ ] Verify memory doesn't leak (check DevTools)

### Test Repositories to Use

1. **This project**: `/Users/truongbui/GolandProjects/git-master`
2. **Large repo**: Clone a large open-source project (e.g., React, Vue)
3. **Empty repo**: `git init /tmp/test-empty-repo`
4. **Non-Git**: Any regular directory

## Implementation Notes

- Use Chrome DevTools to check for errors
- Check Network tab for API calls (shouldn't be any for local Git)
- Check Console for any warnings or errors
- Use React DevTools to inspect store state
- Test on all target platforms (macOS, Windows, Linux)

## Expected Behavior

### Success State
- Repository info loads within 1 second for small repos
- Recent repos list updates immediately
- No flash of loading state for cached data
- Smooth transition from dialog to main view

### Error State
- Clear, actionable error messages
- Dialog remains open to allow retry
- No cryptic technical errors shown to user
- Error toast auto-dismisses after 5 seconds

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0820-feat-create-open-repo-dialog.md
- Depends on: 2025-10-11-0600-feat-create-repository-store.md
- Depends on: 2025-10-11-0645-feat-create-app-header-component.md
