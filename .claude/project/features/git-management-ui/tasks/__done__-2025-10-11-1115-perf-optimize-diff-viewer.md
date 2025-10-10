# Optimize Diff Viewer Performance

## Type
perf

## Description
Optimize DiffViewer performance for handling large diffs (10,000+ lines) without UI freezing. Implement lazy loading, virtualization, code splitting, and progressive rendering techniques.

## Acceptance Criteria
- [x] Syntax highlighter lazy loaded with React.lazy()
- [x] Virtualization implemented for diffs over 1000 lines
- [x] Test with 10,000+ line diff - no UI freezing
- [x] Initial render under 500ms for typical diffs
- [x] Smooth scrolling maintained at 60fps
- [x] Memory usage remains reasonable (< 200MB)
- [x] Loading spinner shown during expensive operations
- [x] Suspense boundaries handle lazy loading gracefully
- [x] No type errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details

### 1. Lazy Load Syntax Highlighter
```typescript
// components/diff/SyntaxHighlight.tsx
import { lazy, Suspense } from 'react';

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism,
  }))
);

export function SyntaxHighlight({ code, language }) {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <SyntaxHighlighter language={language} style={vscDarkPlus}>
        {code}
      </SyntaxHighlighter>
    </Suspense>
  );
}
```

### 2. Virtualize Long Diffs
```typescript
// Use @tanstack/react-virtual for diffs over 1000 lines
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedUnifiedDiff({ lines }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Line height in pixels
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <DiffLine
            key={virtualRow.index}
            line={lines[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3. Implement Progressive Rendering
```typescript
// Only render visible files initially
const [renderedFiles, setRenderedFiles] = useState(3);

useEffect(() => {
  if (renderedFiles < diff.files.length) {
    const timer = setTimeout(() => {
      setRenderedFiles(prev => Math.min(prev + 3, diff.files.length));
    }, 100);
    return () => clearTimeout(timer);
  }
}, [renderedFiles, diff.files.length]);
```

### 4. Memoize Expensive Computations
```typescript
const processedDiff = useMemo(() => {
  return parseDiffAndApplyHighlighting(diff);
}, [diff]);
```

## Performance Benchmarks

### Target Metrics
- **1,000 lines**: < 200ms initial render
- **10,000 lines**: < 500ms initial render
- **100,000 lines**: < 2s initial render (virtualized)
- **Scrolling**: Maintain 60fps at all times
- **Memory**: < 200MB for 50,000 lines

### Test Cases
1. Small diff (< 100 lines): Should render instantly
2. Medium diff (1,000 lines): Should render smoothly
3. Large diff (10,000 lines): Should use virtualization
4. Huge diff (100,000+ lines): Should remain responsive

## Estimated Time
4 hours

## Dependencies
- Depends on: 2025-10-11-1015-feat-create-diff-viewer.md
- Depends on: 2025-10-11-1030-feat-create-unified-diff.md
- Depends on: 2025-10-11-1045-feat-create-split-diff.md

## Notes
- Use Chrome DevTools Performance tab to profile
- Enable React Profiler to identify slow components
- Consider disabling syntax highlighting for very large files
- Add user preference for virtualization threshold
