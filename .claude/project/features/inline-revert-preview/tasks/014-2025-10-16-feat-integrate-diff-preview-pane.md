# Task: Integrate Inline Revert into DiffPreviewPane

## Description
Integrate the complete inline revert feature into the DiffPreviewPane component, which is the main entry point for viewing file diffs in the changelist panel. This involves passing necessary callbacks, handling diff refresh after reverts, and ensuring smooth integration with existing changelist state management.

## Acceptance Criteria
- [ ] DiffPreviewPane component modified to support inline revert
- [ ] Refresh callback implemented to reload diff after revert
- [ ] Integration with changelist store for state updates
- [ ] Integration with staging store for git status refresh
- [ ] Loading states handled during revert operations
- [ ] Error handling integrated with existing error patterns
- [ ] Toast notifications work correctly
- [ ] No regression in existing functionality
- [ ] Feature works for both staged and unstaged files
- [ ] Performance maintained (no noticeable lag)

## Technical Considerations
- DiffPreviewPane renders FullFileSplitDiffViewer which now has inline revert
- Need to pass refresh callback down through component tree
- After revert, must refresh Git status to reflect changes
- Update changelist state if file moves between groups
- Handle race conditions (multiple reverts in quick succession)
- Ensure cache invalidation after revert
- Maintain scroll position after refresh when possible
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 001, 002, 006, 012, 013
- Blocks: 015

## Estimated Effort
5-6 hours

## Implementation Notes

### File Location
Modify existing: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/changelist/DiffPreviewPane.tsx`

### Changes Required

1. **Add state for refresh**:
```typescript
const [refreshKey, setRefreshKey] = useState(0);
const clearCache = useCallback(() => {
  cacheRef.current = {};
}, []);
```

2. **Implement refresh callback**:
```typescript
const handleDiffRefresh = useCallback(async () => {
  if (!selectedFile) return;

  // Clear cache for this file
  const cacheKey = getCacheKey(selectedFile);
  delete cacheRef.current[cacheKey];

  // Trigger re-fetch
  await fetchDiff(selectedFile);

  // Refresh changelist state
  const newStatus = await getWorkingDirectoryStatus();
  const statusSignature = JSON.stringify({
    staged: newStatus.stagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
    unstaged: newStatus.unstagedFiles.map((f) => `${f.path}:${f.status}`).sort(),
    untracked: newStatus.untrackedFiles.map((f) => `${f.path}:${f.status}`).sort(),
  });

  await reconcileWithGitStatus(currentRepository.path, statusSignature);

  // Increment refresh key to force FullFileSplitDiffViewer remount
  setRefreshKey((prev) => prev + 1);
}, [selectedFile, fetchDiff, currentRepository]);
```

3. **Pass callback to FullFileSplitDiffViewer**:
```typescript
<FullFileSplitDiffViewer
  key={refreshKey}
  oldContent={fileContent.oldContent}
  newContent={fileContent.newContent}
  fileName={selectedFile.path}
  isLoading={false}
  oldCommitHash="Working Tree (Old)"
  newCommitHash="Working Tree (Current)"
  onRefresh={handleDiffRefresh}
/>
```

4. **Update FullFileSplitDiffViewer props**:
Add optional onRefresh prop to FullFileSplitDiffViewer and pass it to DiffLineWithRevert revert callback.

### Integration with Stores

**Changelist Store**:
- Call reconcileWithGitStatus after revert to update file groups
- Handle case where file moves to different group after partial revert
- Handle case where file is completely reverted (removed from all groups)

**Staging Store**:
- Use loadChanges() to refresh Git status
- Update staged/unstaged file lists

**Revert Store**:
- Clear consecutive blocks cache for modified file
- Add operation to revert history

### Error Handling

Comprehensive error handling for:
- Backend revert failures
- Patch generation errors
- Git status refresh failures
- Cache invalidation errors
- Network/communication errors

Show user-friendly error messages with recovery options.

### Testing Strategy
- Test revert of single line refreshes diff
- Test revert of multiple lines refreshes diff
- Test file moves between groups after partial revert
- Test file removed from groups after full revert
- Test error scenarios
- Test rapid successive reverts
- Test with large files
- Test with both staged and unstaged files

### Performance Considerations
- Debounce rapid revert operations
- Use optimistic UI updates where possible
- Minimize full component remounts
- Keep diff parsing efficient
