# Test Commit List Performance

## Type
test

## Description
Performance test the CommitList component with various repository sizes to ensure smooth scrolling, efficient memory usage, and proper virtualization behavior with 60fps target.

## Acceptance Criteria
- [ ] Smooth scrolling (60fps) with 1,000 commits
- [ ] Smooth scrolling (60fps) with 10,000 commits
- [ ] Smooth scrolling (60fps) with 50,000+ commits
- [ ] Memory usage stays under 200MB for 10,000 commits
- [ ] Initial load time under 1 second for first 100 commits
- [ ] Pagination loads next page in under 500ms
- [ ] No janky scrolling or frame drops
- [ ] Virtualization renders only ~20-30 DOM nodes at a time
- [ ] Search/filter maintains performance

## Technical Details

### Performance Test Scenarios

**Scenario 1: Small Repository (< 1,000 commits)**
- Test repo: This project or similar small repo
- Expected: Instant loading, butter-smooth scrolling
- Metrics:
  - Initial load: < 500ms
  - FPS during scroll: 60fps
  - Memory: < 50MB

**Scenario 2: Medium Repository (1,000 - 10,000 commits)**
- Test repo: React, Vue, or Angular
- Expected: Fast loading, smooth scrolling
- Metrics:
  - Initial load: < 1s
  - FPS during scroll: 60fps
  - Memory: < 150MB
  - Scroll to position 5,000: No lag

**Scenario 3: Large Repository (10,000 - 50,000 commits)**
- Test repo: Linux kernel, Chromium (if available)
- Expected: Acceptable loading, maintained smooth scrolling
- Metrics:
  - Initial load: < 2s
  - FPS during scroll: 60fps
  - Memory: < 200MB
  - Scroll to position 25,000: Slight delay acceptable

**Scenario 4: Infinite Scroll**
- Test repo: Any repo with 1,000+ commits
- Actions:
  1. Scroll to bottom rapidly
  2. Verify "Load more" triggers
  3. Verify new commits append smoothly
  4. Verify scroll position maintained
  5. Repeat 10 times
- Expected: No memory leaks, consistent performance

**Scenario 5: Search Performance**
- Test repo: Any repo with 10,000+ commits
- Actions:
  1. Type search query (e.g., "fix bug")
  2. Wait for debounce (300ms)
  3. Verify filtered list renders
  4. Clear search
  5. Verify full list restores
- Expected: No stuttering during filter changes

### Performance Measurement Tools

**Chrome DevTools - Performance Tab**
```
1. Open DevTools (Cmd+Option+I)
2. Go to Performance tab
3. Click Record
4. Perform test actions (scroll, load, etc.)
5. Stop recording
6. Analyze:
   - FPS (should be 60)
   - Main thread activity
   - Memory allocation
   - Long tasks (should be < 50ms)
```

**Chrome DevTools - Memory Tab**
```
1. Open DevTools
2. Go to Memory tab
3. Take heap snapshot before test
4. Perform test actions
5. Take heap snapshot after
6. Compare memory usage
7. Look for detached DOM nodes
```

**React DevTools - Profiler**
```
1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Scroll through commit list
5. Stop recording
6. Analyze component render times
7. Verify CommitItem renders are fast (< 16ms)
```

### Performance Benchmarks

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Initial Load (100 commits) | < 500ms | < 1s | > 2s |
| FPS during scroll | 60 | 55+ | < 50 |
| Memory (10K commits) | < 150MB | < 200MB | > 300MB |
| Load more page | < 300ms | < 500ms | > 1s |
| Search response | < 300ms | < 500ms | > 1s |
| DOM nodes rendered | 20-30 | 40 | > 100 |

### Test Checklist

- [ ] **Scenario 1**: Small repo performance verified
- [ ] **Scenario 2**: Medium repo performance verified
- [ ] **Scenario 3**: Large repo performance verified
- [ ] **Scenario 4**: Infinite scroll tested
- [ ] **Scenario 5**: Search performance verified
- [ ] **FPS**: 60fps maintained during scroll
- [ ] **Memory**: No leaks detected
- [ ] **DOM nodes**: Virtualization working (< 50 nodes)
- [ ] **Loading**: Pagination works smoothly
- [ ] **Responsiveness**: No UI blocking

### Performance Optimization Tips

If performance issues found:

1. **Slow scrolling**:
   - Check virtualization is enabled
   - Verify row height estimates are accurate
   - Add `will-change: transform` to virtual items
   - Use `contain: strict` on scroll container

2. **High memory usage**:
   - Check for memory leaks in useEffect
   - Verify old commits are released
   - Use React DevTools to find retained objects

3. **Slow pagination**:
   - Check backend API response time
   - Verify debouncing on scroll events
   - Optimize commit parsing

4. **Janky rendering**:
   - Use React.memo for CommitItem
   - Avoid inline function props
   - Use CSS transforms instead of position changes

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0830-feat-create-commit-list.md
- Depends on: 2025-10-11-0845-feat-create-commit-item.md
- Depends on: 2025-10-11-0915-feat-connect-commit-list-wails.md

## Notes
- Performance testing should be done on production build
- Development build will be slower due to React DevTools
- Test on multiple machines if possible (different specs)
- Document any performance issues found
- Create follow-up tasks for optimizations if needed
