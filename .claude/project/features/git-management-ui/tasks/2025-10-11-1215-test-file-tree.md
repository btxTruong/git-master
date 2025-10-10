# Test File Tree

## Type
test

## Description
Manually test the FileTree component with various scenarios including deeply nested paths, large file lists, expand/collapse functionality, and file selection behavior.

## Acceptance Criteria
- [ ] Renders 100+ files without performance issues
- [ ] Expand/collapse animations smooth
- [ ] File selection highlights correctly
- [ ] Deeply nested paths (5+ levels) render correctly
- [ ] Folders sort before files alphabetically
- [ ] File status indicators display correctly
- [ ] Clicking folders toggles expansion
- [ ] Clicking files selects them
- [ ] Smooth scrolling with large lists

## Technical Details

### Test Scenarios

**Scenario 1: Small File Set (10 files)**
1. Create test data with 10 files in 3 folders
2. Render FileTree component
3. Verify all files visible
4. Expand/collapse each folder
5. Select different files
6. Verify visual feedback

**Scenario 2: Large File Set (500+ files)**
1. Generate 500+ files across multiple directories
2. Render FileTree
3. Verify initial render < 500ms
4. Scroll through list - verify smooth scrolling
5. Expand/collapse large folders
6. Verify no performance degradation

**Scenario 3: Deep Nesting (7+ levels)**
1. Create files with paths like: `a/b/c/d/e/f/g/file.txt`
2. Render FileTree
3. Expand all folders
4. Verify proper indentation at each level
5. Verify folder icons update correctly
6. Verify no layout issues

**Scenario 4: Mixed Status Files**
1. Create files with different statuses (M, A, D, R)
2. Render FileTree
3. Verify status badges show correct colors
4. Verify status icons match
5. Verify status sorting is consistent

**Scenario 5: File Selection**
1. Click on file A
2. Verify file A highlighted
3. Click on file B
4. Verify file A no longer highlighted
5. Verify file B highlighted
6. Verify onFileSelect callback fired

**Scenario 6: Folder Operations**
1. Click on collapsed folder
2. Verify folder expands
3. Verify chevron icon changes
4. Verify folder icon changes (Folder → FolderOpen)
5. Click again
6. Verify folder collapses
7. Verify smooth animation

### Manual Test Checklist

- [ ] Small file set renders correctly
- [ ] Large file set performs well
- [ ] Deep nesting renders correctly
- [ ] Status indicators correct
- [ ] File selection works
- [ ] Folder expand/collapse smooth
- [ ] Icons update correctly
- [ ] No console errors
- [ ] Memory usage reasonable
- [ ] Scrolling smooth at 60fps

### Performance Benchmarks

- **100 files**: Render < 100ms
- **500 files**: Render < 300ms
- **1000 files**: Render < 600ms
- **Scroll FPS**: 60fps consistent
- **Memory**: < 50MB for 1000 files

## Test Data Generator

```typescript
// Test helper to generate file data
function generateTestFiles(count: number): FileChange[] {
  const statuses: FileStatus[] = ['modified', 'added', 'deleted', 'renamed'];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.md'];

  return Array.from({ length: count }, (_, i) => {
    const depth = Math.floor(Math.random() * 5) + 1;
    const folders = Array.from({ length: depth }, (_, j) => `folder${j}`);
    const file = `file${i}${extensions[i % extensions.length]}`;
    const path = [...folders, file].join('/');

    return {
      path,
      status: statuses[i % statuses.length],
      staged: false,
    };
  });
}
```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-1130-feat-create-file-tree.md
- Depends on: 2025-10-11-1145-feat-create-file-item.md
- Depends on: 2025-10-11-1200-feat-build-file-tree-utility.md

## Notes
- Use React DevTools Profiler to identify slow renders
- Monitor memory usage with Chrome DevTools
- Test with real Git repository data for authenticity
- Consider adding virtualization if performance issues occur
