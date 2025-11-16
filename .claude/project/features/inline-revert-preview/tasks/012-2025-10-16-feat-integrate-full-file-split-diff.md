# Task: Integrate DiffLineWithRevert into FullFileSplitDiffViewer

## Description
Modify the existing FullFileSplitDiffViewer component to integrate the new DiffLineWithRevert wrapper for changed lines in the right (new content) pane. This involves detecting consecutive blocks on initial render, wrapping appropriate lines, and implementing the revert callback that applies patches via backend API.

## Acceptance Criteria
- [ ] FullFileSplitDiffViewer imports and uses DiffLineWithRevert
- [ ] Consecutive blocks detected on initial diff data load
- [ ] Blocks stored in revert store for quick lookup
- [ ] Changed lines in right pane wrapped with DiffLineWithRevert
- [ ] Context lines render normally without wrapper
- [ ] Revert callback implemented and integrated with backend API
- [ ] Diff view refreshes after successful revert
- [ ] Error handling implemented for revert failures
- [ ] Toast notifications shown for success/error
- [ ] Component performance maintained (no noticeable lag)
- [ ] Virtual scrolling still works correctly

## Technical Considerations
- Only wrap lines in the NEW (right) pane, not OLD (left) pane
- Run consecutive block detection in useEffect when diff data changes
- Memoize block detection results to prevent recalculation
- Generate unique file key based on file path and content hash
- Implement revert callback that generates patch and calls backend
- Refresh diff data after successful revert
- Handle loading states during revert operations
- Ensure no layout shifts when buttons appear
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants
- Reminder: Keep files under 500 lines (split if needed)

## Dependencies
- Depends on: 011 (DiffLineWithRevert component)
- Blocks: 013, 014

## Estimated Effort
7-8 hours

## Implementation Notes

### File Location
Modify existing: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/FullFileSplitDiffViewer.tsx`

### Integration Steps

1. **Import dependencies**:
```typescript
import { DiffLineWithRevert } from './DiffLineWithRevert';
import { detectConsecutiveBlocks } from '@/utils/consecutiveLineDetector';
import { generateSingleLineRevertPatch, generateBulkLineRevertPatch } from '@/utils/patchGenerator';
import { RevertLineChanges, RevertLineRangeChanges } from '../../../wailsjs/go/services/StagingService';
import { useRevertStore } from '@/stores/revertStore';
```

2. **Detect consecutive blocks**:
```typescript
const setConsecutiveBlocks = useRevertStore((state) => state.setConsecutiveBlocks);

useEffect(() => {
  if (newLines.length > 0) {
    const blocks = detectConsecutiveBlocks(newLines);
    const fileKey = `${fileName}:${contentHash}`;
    setConsecutiveBlocks(fileKey, blocks);
  }
}, [newLines, fileName, setConsecutiveBlocks]);
```

3. **Implement revert callback**:
```typescript
const handleLineRevert = useCallback(
  async (startIndex: number, endIndex: number) => {
    try {
      // Generate patch
      const patch = startIndex === endIndex
        ? generateSingleLineRevertPatch(/* ... */)
        : generateBulkLineRevertPatch(/* ... */);

      // Apply patch via backend
      if (startIndex === endIndex) {
        await RevertLineChanges(fileName, startIndex, patch);
      } else {
        await RevertLineRangeChanges(fileName, startIndex, endIndex, patch);
      }

      // Refresh diff
      await refreshDiff();

      toast.success(
        startIndex === endIndex
          ? 'Line reverted successfully'
          : `${endIndex - startIndex + 1} lines reverted successfully`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revert';
      toast.error(message);
    }
  },
  [fileName, refreshDiff]
);
```

4. **Wrap lines in render**:
```typescript
// In right pane rendering
{newLines.map((line, index) => {
  const shouldWrapWithRevert = line.type !== 'context';

  if (shouldWrapWithRevert) {
    return (
      <DiffLineWithRevert
        key={index}
        line={line}
        lineIndex={index}
        fileKey={fileKey}
        renderLineContent={(line) => renderLineContent(line, 'new')}
        onRevert={handleLineRevert}
        className={/* existing classes */}
      />
    );
  }

  return (
    <div key={index} className={/* existing classes */}>
      {renderLineContent(line, 'new')}
    </div>
  );
})}
```

### File Key Generation
```typescript
const fileKey = useMemo(() => {
  const contentHash = hashString(`${oldContent}${newContent}`);
  return `${fileName}:${contentHash}`;
}, [fileName, oldContent, newContent]);
```

### Refresh Mechanism
Call existing prop or implement new refresh function that reloads diff data from backend.

### Testing Strategy
- Test consecutive block detection on component mount
- Test revert callback with single line
- Test revert callback with multiple lines
- Test error handling
- Test diff refresh after revert
- Test performance with large files
