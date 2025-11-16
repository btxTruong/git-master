# Task: Implement Consecutive Line Detection Algorithm

## Description
Create utility function to analyze diff line data and identify blocks of consecutive changed lines. This algorithm will determine which lines can be reverted together as a bulk operation, improving UX by grouping related changes. The detector must handle all diff line types and work efficiently with large files.

## Acceptance Criteria
- [ ] detectConsecutiveBlocks function implemented and exported
- [ ] Correctly identifies consecutive changed lines (non-context lines adjacent to each other)
- [ ] Handles mixed change types within a block (add, delete, modify)
- [ ] Returns block metadata (start index, end index, line count, change types)
- [ ] Skips context lines when determining consecutiveness
- [ ] Efficiently handles large arrays (10,000+ lines)
- [ ] TypeScript types defined for ConsecutiveBlock structure
- [ ] Comprehensive JSDoc documentation
- [ ] Unit tests with 90%+ coverage

## Technical Considerations
- Use linear time O(n) algorithm for efficiency
- Group only lines that are truly consecutive (no context lines between)
- Minimum block size of 2 lines (single lines don't need bulk operation)
- Track change type for each block (add, delete, modify, mixed)
- Use descriptive variable names for clarity
- Extract threshold values to named constants (MIN_CONSECUTIVE_BLOCK_SIZE)
- Memoize results for performance when called repeatedly with same data
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 001 (backend service), 004 (patch generation)
- Blocks: 008, 011

## Estimated Effort
5-6 hours

## Implementation Notes

### File Location
Create new file: `/Users/truongbui/GolandProjects/git-master/frontend/src/utils/consecutiveLineDetector.ts`

### Type Definitions
```typescript
export interface ConsecutiveBlock {
  startIndex: number;
  endIndex: number;
  lineCount: number;
  changeType: 'add' | 'delete' | 'modify' | 'mixed';
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}
```

### Function Signature
```typescript
export function detectConsecutiveBlocks(lines: DiffLine[]): ConsecutiveBlock[];
```

### Algorithm Pseudocode
```
1. Initialize empty blocks array
2. Initialize currentBlock as null
3. For each line in lines:
   a. If line is context:
      - Save currentBlock if it has 2+ lines
      - Reset currentBlock to null
   b. If line is changed (add/delete):
      - If no currentBlock, start new one
      - If currentBlock exists and previous line was not context, extend it
      - Otherwise, save old block and start new one
4. Save final block if it has 2+ lines
5. Return blocks array
```

### Performance Considerations
- Single pass through array: O(n) time complexity
- Minimal memory overhead: only stores block metadata
- Consider memoization if called frequently with same data

### Testing Strategy
- Test with various diff structures
- Test with large arrays (10,000+ lines)
- Test edge cases (all context, all changed, alternating)
- Measure performance with profiler

### Edge Cases to Handle
- Empty array
- All context lines (no blocks)
- All changed lines (one large block)
- Single changed line (no blocks)
- Alternating changed and context lines
- Very long consecutive blocks (1000+ lines)
