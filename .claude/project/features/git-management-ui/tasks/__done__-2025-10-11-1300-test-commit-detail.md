# Test Commit Detail View

## Type
test

## Description
Manually test the CommitDetail component with various commit types including regular commits, merge commits, initial commits, and commits with large diffs. Verify all metadata displays correctly and diff viewer integration works.

## Acceptance Criteria
- [ ] Selecting commit from list shows detail view
- [ ] Commit hash, author, date display correctly
- [ ] Full commit message shown with formatting
- [ ] Diff loads and renders without errors
- [ ] File navigation sidebar works
- [ ] View mode toggle (unified/split) works
- [ ] Copy hash button works
- [ ] Parent commit links work
- [ ] Merge commits show multiple parents
- [ ] Performance acceptable for large diffs

## Technical Details

### Test Scenarios

**Scenario 1: Regular Commit**
1. Select a regular commit from history
2. Verify CommitDetail panel appears
3. Check all metadata fields populated
4. Verify diff loads within 1 second
5. Check file statistics match
6. Switch between unified and split view
7. Verify both views render correctly

**Scenario 2: Merge Commit**
1. Select a merge commit
2. Verify multiple parent commits shown
3. Check parent commit links clickable
4. Verify merge commit message displayed
5. Check diff shows all merged changes

**Scenario 3: Initial Commit**
1. Navigate to first commit in repository
2. Verify no parent commits shown
3. Check all files show as "added"
4. Verify diff shows full file content

**Scenario 4: Large Diff (1000+ lines)**
1. Find commit with large diff
2. Select commit
3. Verify loading spinner appears
4. Check diff loads progressively
5. Verify no UI freezing
6. Test scrolling performance

**Scenario 5: Commit with Many Files (50+)**
1. Select commit changing 50+ files
2. Check file navigation sidebar
3. Click different files
4. Verify scrolling to correct file
5. Check performance remains good

**Scenario 6: Binary File Changes**
1. Select commit with binary files
2. Verify binary files labeled
3. Check "Binary file not shown" message
4. Verify no crash or error

**Scenario 7: Copy Hash**
1. Click copy hash button
2. Paste into text editor
3. Verify full commit hash copied
4. Check toast notification shown

**Scenario 8: Navigation**
1. Click parent commit link
2. Verify navigates to parent commit
3. Use browser back button
4. Verify returns to original commit

### Manual Test Checklist

- [ ] Regular commit displays correctly
- [ ] Merge commit shows multiple parents
- [ ] Initial commit handled
- [ ] Large diff loads without freezing
- [ ] Many files handled efficiently
- [ ] Binary files shown correctly
- [ ] Copy hash works
- [ ] Parent navigation works
- [ ] No console errors
- [ ] Performance acceptable

### Test Commits

Use these Git commands to find test commits:

```bash
# Regular commit
git log --oneline -1

# Merge commit
git log --merges --oneline -1

# Initial commit
git log --reverse --oneline -1

# Large diff
git log --stat --oneline | grep "files changed" | sort -nr | head -1

# Commit with binary files
git log --all --full-history --diff-filter=A -- "*.png" "*.jpg"
```

## Expected Behavior

### Success State
- Metadata loads instantly (< 100ms)
- Diff loads within 1-2 seconds
- Smooth scrolling in diff viewer
- No layout shifts during loading
- Responsive to user interactions

### Error State
- Clear error message if diff fetch fails
- Retry button available
- Commit metadata still visible
- No app crash

## Performance Benchmarks

- **Small diff (< 100 lines)**: Load < 200ms
- **Medium diff (1000 lines)**: Load < 1s
- **Large diff (10,000 lines)**: Load < 3s
- **Scroll FPS**: 60fps maintained
- **Memory**: < 150MB for 10,000 line diff

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-1230-feat-create-commit-detail.md
- Depends on: 2025-10-11-1245-feat-integrate-diff-in-detail.md

## Notes
- Test with actual repository data for realism
- Use Chrome DevTools to monitor performance
- Check network tab for API calls timing
- Profile with React DevTools if slow renders occur
