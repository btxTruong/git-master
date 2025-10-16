# Task: Create Revert State Management Store

## Description
Implement a new Zustand store to manage state for inline revert operations. The store will track hover state, consecutive block data, pending operations, and revert history. This centralizes state management and provides a clean API for components to interact with revert functionality.

## Acceptance Criteria
- [ ] revertStore.ts created with all required state and actions
- [ ] Hover state management implemented (hoveredLineIndex)
- [ ] Consecutive blocks cache implemented with Map structure
- [ ] Pending operations tracking implemented with Set
- [ ] Revert history management implemented with array
- [ ] All actions properly typed with TypeScript
- [ ] Store integrated with existing Zustand setup
- [ ] Selectors created for common access patterns
- [ ] Store persists revert history to localStorage (optional)
- [ ] Comprehensive JSDoc documentation

## Technical Considerations
- Follow existing store patterns in project (see changelistStore, stagingStore)
- Use Zustand's immer middleware for immutable updates
- Keep state minimal and derived state in selectors
- Use Map for consecutive blocks cache for O(1) lookup
- Use Set for pending operations for O(1) add/remove
- Limit revert history to last 50 operations to prevent memory issues
- Create selectors for frequently accessed state
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants (REVERT_HISTORY_MAX_SIZE)
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 006 (consecutive line detector)
- Blocks: 009, 011, 014

## Estimated Effort
5-6 hours

## Implementation Notes

### File Location
Create new file: `/Users/truongbui/GolandProjects/git-master/frontend/src/stores/revertStore.ts`

### State Structure
```typescript
interface RevertState {
  // Hover state
  hoveredLineIndex: number | null;
  setHoveredLineIndex: (index: number | null) => void;

  // Consecutive blocks cache
  consecutiveBlocksCache: Map<string, ConsecutiveBlock[]>;
  setConsecutiveBlocks: (fileKey: string, blocks: ConsecutiveBlock[]) => void;
  getConsecutiveBlocks: (fileKey: string) => ConsecutiveBlock[] | undefined;
  clearConsecutiveBlocksCache: () => void;

  // Pending operations
  pendingReverts: Set<string>;
  addPendingRevert: (operationId: string) => void;
  removePendingRevert: (operationId: string) => void;
  isPending: (operationId: string) => boolean;

  // Revert history
  revertHistory: RevertOperation[];
  addToHistory: (operation: RevertOperation) => void;
  clearHistory: () => void;
  getLastOperation: () => RevertOperation | undefined;
}

interface RevertOperation {
  id: string;
  fileKey: string;
  timestamp: number;
  filePath: string;
  lineRange: { start: number; end: number };
  originalContent: string[];
  revertedContent: string[];
}
```

### File Key Generation
Use combination of file path and content hash to uniquely identify file state:
```typescript
const fileKey = `${filePath}:${contentHash}`;
```

### Selectors
Create selector file: `/Users/truongbui/GolandProjects/git-master/frontend/src/stores/selectors/revertSelectors.ts`

```typescript
export const useIsLineHovered = (lineIndex: number) =>
  useRevertStore((state) => state.hoveredLineIndex === lineIndex);

export const useConsecutiveBlockForLine = (fileKey: string, lineIndex: number) =>
  useRevertStore((state) => {
    const blocks = state.getConsecutiveBlocks(fileKey);
    return blocks?.find(
      (block) => lineIndex >= block.startIndex && lineIndex <= block.endIndex
    );
  });
```

### Store Implementation
```typescript
export const useRevertStore = create<RevertState>((set, get) => ({
  hoveredLineIndex: null,
  consecutiveBlocksCache: new Map(),
  pendingReverts: new Set(),
  revertHistory: [],

  setHoveredLineIndex: (index) => set({ hoveredLineIndex: index }),

  // ... implement remaining actions
}));
```

### Testing Strategy
- Test all actions update state correctly
- Test selectors return correct values
- Test history limit enforcement
- Test cache cleanup

### Integration Points
- Called by DiffLineWithRevert component
- Called by InlineRevertButton component
- Used by FullFileSplitDiffViewer for initial block detection
