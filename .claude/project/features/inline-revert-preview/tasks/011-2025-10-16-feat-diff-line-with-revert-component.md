# Task: Create DiffLineWithRevert Wrapper Component

## Description
Build a wrapper component that manages hover state for diff lines and conditionally renders the InlineRevertButton. This component handles the interaction logic, determines if a line is part of a consecutive block, and coordinates with the revert store for state management.

## Acceptance Criteria
- [ ] DiffLineWithRevert component created with proper TypeScript types
- [ ] Hover detection implemented using onMouseEnter and onMouseLeave
- [ ] Updates revert store with hovered line index
- [ ] Determines if line is part of consecutive block
- [ ] Shows single line button or bulk button based on context
- [ ] Renders existing line content using provided render function
- [ ] Handles revert callback execution
- [ ] Prevents hover state issues during scrolling
- [ ] Debounces hover state updates (50ms)
- [ ] Works correctly with virtual scrolling
- [ ] Memoized for performance

## Technical Considerations
- Use useCallback for event handlers to prevent re-renders
- Use useMemo for expensive calculations (block detection)
- Debounce hover updates to improve performance
- Clean up state on unmount
- Handle edge case where line is first/last in consecutive block
- Coordinate with revert store for global hover state
- Position button relative to line content
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants (HOVER_DEBOUNCE_MS)
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 006 (consecutive detector), 008 (revert store), 010 (button component)
- Blocks: 012

## Estimated Effort
6-7 hours

## Implementation Notes

### File Location
Create new file: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/DiffLineWithRevert.tsx`

### Component Props
```typescript
interface DiffLineWithRevertProps {
  line: DiffLine;
  lineIndex: number;
  fileKey: string;
  renderLineContent: (line: DiffLine) => ReactNode;
  onRevert: (startIndex: number, endIndex: number) => Promise<void>;
  className?: string;
}
```

### Component Structure
```tsx
export const DiffLineWithRevert: React.FC<DiffLineWithRevertProps> = ({
  line,
  lineIndex,
  fileKey,
  renderLineContent,
  onRevert,
  className,
}) => {
  const setHoveredLineIndex = useRevertStore((state) => state.setHoveredLineIndex);
  const hoveredLineIndex = useRevertStore((state) => state.hoveredLineIndex);
  const getConsecutiveBlocks = useRevertStore((state) => state.getConsecutiveBlocks);

  // Debounced hover handler
  const handleMouseEnter = useDebouncedCallback(() => {
    setHoveredLineIndex(lineIndex);
  }, HOVER_DEBOUNCE_MS);

  const handleMouseLeave = useDebouncedCallback(() => {
    setHoveredLineIndex(null);
  }, HOVER_DEBOUNCE_MS);

  // Determine if this line is part of consecutive block
  const consecutiveBlock = useMemo(() => {
    const blocks = getConsecutiveBlocks(fileKey);
    return blocks?.find(
      (block) => lineIndex >= block.startIndex && lineIndex <= block.endIndex
    );
  }, [fileKey, lineIndex, getConsecutiveBlocks]);

  // Determine button mode
  const isBulkMode = consecutiveBlock && consecutiveBlock.lineCount >= 2;
  const showButton =
    line.type !== 'context' &&
    hoveredLineIndex === lineIndex &&
    (!isBulkMode || lineIndex === consecutiveBlock.startIndex);

  const handleRevert = useCallback(async () => {
    if (isBulkMode && consecutiveBlock) {
      await onRevert(consecutiveBlock.startIndex, consecutiveBlock.endIndex);
    } else {
      await onRevert(lineIndex, lineIndex);
    }
  }, [isBulkMode, consecutiveBlock, lineIndex, onRevert]);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-line-index={lineIndex}
    >
      {renderLineContent(line)}
      {showButton && (
        <InlineRevertButton
          lineIndex={lineIndex}
          changeType={line.type as 'add' | 'delete' | 'modify'}
          isBulkMode={isBulkMode}
          bulkLineCount={consecutiveBlock?.lineCount}
          onRevert={handleRevert}
          isVisible={showButton}
        />
      )}
    </div>
  );
};
```

### Hover Debouncing
Use custom hook or lodash debounce:
```typescript
const HOVER_DEBOUNCE_MS = 50;

const debouncedSetHovered = useDebouncedCallback(
  (index: number | null) => setHoveredLineIndex(index),
  HOVER_DEBOUNCE_MS
);
```

### Consecutive Block Logic
- Check if line is within any block's range
- Show bulk button only on first line of block
- Pass block size to button component

### Testing Strategy
- Test hover detection works correctly
- Test consecutive block detection
- Test button shows/hides appropriately
- Test bulk vs single mode selection
- Test revert callback execution
- Test debouncing prevents excessive updates
