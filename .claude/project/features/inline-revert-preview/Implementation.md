# Implementation Plan: Inline Revert Function in Working Change Preview

## Technology Stack

### Frontend
- **React**: 18.2.0
- **TypeScript**: 4.6.4
- **Zustand**: 5.0.8 (state management)
- **Lucide React**: 0.545.0 (icons - ChevronsRight)
- **React Hot Toast**: 2.6.0 (notifications)
- **Tailwind CSS**: 4.1.14 (styling)

### Backend
- **Go**: Current version
- **Git**: System git command
- **Wails**: Current framework version

### New Utilities
- **Patch Generation**: Custom TypeScript utility for creating Git patches
- **Line Range Detector**: Utility for identifying consecutive changed lines
- **Hover State Manager**: React hook for managing hover interactions

## Architecture

### Component Hierarchy

```
FullFileSplitDiffViewer (Modified)
├── DiffNavigationBar (Existing)
├── ScrollContainer (Existing)
│   ├── LeftPane (Old Content - No Changes)
│   └── RightPane (New Content - Modified)
│       ├── HeaderLabel (Existing)
│       ├── LineNumberColumn (Existing)
│       ├── IndicatorColumn (Existing)
│       └── ContentColumn (Modified)
│           └── DiffLineWithRevert (New Component)
│               ├── LineContent (Existing)
│               └── InlineRevertButton (New Component)
│                   ├── SingleLineRevertButton
│                   └── BulkLineRevertButton
└── HorizontalScrollbars (Existing)
```

### New Components

#### 1. InlineRevertButton
**Purpose**: Displays the revert button for a single line or bulk consecutive lines

**Props**:
```typescript
interface InlineRevertButtonProps {
  lineIndex: number;
  lineContent: string;
  changeType: 'add' | 'delete' | 'modify';
  isBulkStart?: boolean;
  bulkLineCount?: number;
  onRevert: (lineIndex: number, isBulk: boolean) => Promise<void>;
  isHovered: boolean;
}
```

**Behavior**:
- Renders ChevronsRight icon from lucide-react
- Shows on hover with smooth fade-in animation (150ms)
- Positioned absolutely to the right of line content
- For bulk operations, shows badge with line count
- Handles click events and triggers revert callback

#### 2. DiffLineWithRevert
**Purpose**: Wraps a diff line with hover detection and revert button management

**Props**:
```typescript
interface DiffLineWithRevertProps {
  line: DiffLine;
  lineIndex: number;
  renderLineContent: (line: DiffLine, side: 'new') => ReactNode;
  onRevert: (startIndex: number, endIndex: number) => Promise<void>;
  consecutiveChangeInfo?: {
    isFirst: boolean;
    isLast: boolean;
    blockSize: number;
  };
}
```

**Behavior**:
- Manages hover state for the line
- Determines if line is part of consecutive block
- Renders InlineRevertButton when appropriate
- Handles smooth animations and transitions

### State Management

#### New Zustand Store: `revertStore.ts`

```typescript
interface RevertState {
  // Currently hovering line info
  hoveredLineIndex: number | null;
  setHoveredLineIndex: (index: number | null) => void;

  // Consecutive change blocks cache
  consecutiveBlocks: Map<string, ConsecutiveBlock[]>;
  setConsecutiveBlocks: (fileKey: string, blocks: ConsecutiveBlock[]) => void;

  // Pending revert operations
  pendingReverts: Set<string>;
  addPendingRevert: (operationId: string) => void;
  removePendingRevert: (operationId: string) => void;

  // Revert history for undo
  revertHistory: RevertOperation[];
  addToHistory: (operation: RevertOperation) => void;
  clearHistory: () => void;
}

interface ConsecutiveBlock {
  startIndex: number;
  endIndex: number;
  lineCount: number;
  changeType: 'add' | 'delete' | 'modify' | 'mixed';
}

interface RevertOperation {
  fileKey: string;
  timestamp: number;
  originalContent: string;
  revertedContent: string;
  lineRange: { start: number; end: number };
}
```

### Data Flow

#### 1. Line Hover Detection
```
User hovers over changed line
  ↓
DiffLineWithRevert detects hover
  ↓
Updates revertStore.hoveredLineIndex
  ↓
InlineRevertButton fades in
```

#### 2. Consecutive Block Detection
```
FullFileSplitDiffViewer receives diff data
  ↓
Utility function analyzes newLines array
  ↓
Identifies consecutive changed lines
  ↓
Stores in revertStore.consecutiveBlocks
  ↓
DiffLineWithRevert receives block info via props
```

#### 3. Single Line Revert Flow
```
User clicks single line revert button
  ↓
InlineRevertButton.onRevert callback triggered
  ↓
Generate patch for single line
  ↓
Call backend API: RevertLineChanges(filePath, lineNumber, patch)
  ↓
Backend applies patch using git apply
  ↓
Frontend refreshes diff view
  ↓
Show success toast with undo option
  ↓
Add operation to revert history
```

#### 4. Bulk Line Revert Flow
```
User clicks bulk revert button
  ↓
Check if confirmation needed (6+ lines)
  ↓
Show confirmation dialog if needed
  ↓
User confirms
  ↓
Generate patch for line range
  ↓
Call backend API: RevertLineRangeChanges(filePath, startLine, endLine, patch)
  ↓
Backend applies patch
  ↓
Frontend refreshes diff view
  ↓
Show success toast
  ↓
Add operation to revert history
```

### Consecutive Line Detection Algorithm

```typescript
/**
 * Detects consecutive changed lines in diff data
 * Groups lines that are adjacent and have compatible change types
 */
function detectConsecutiveBlocks(lines: DiffLine[]): ConsecutiveBlock[] {
  const blocks: ConsecutiveBlock[] = [];
  let currentBlock: ConsecutiveBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip context lines
    if (line.type === 'context') {
      if (currentBlock && currentBlock.lineCount >= 2) {
        blocks.push(currentBlock);
      }
      currentBlock = null;
      continue;
    }

    // Start new block or extend existing
    if (!currentBlock) {
      currentBlock = {
        startIndex: i,
        endIndex: i,
        lineCount: 1,
        changeType: line.type,
      };
    } else {
      // Check if consecutive (indices are sequential and types are compatible)
      const prevLine = lines[i - 1];
      if (prevLine.type !== 'context') {
        currentBlock.endIndex = i;
        currentBlock.lineCount++;
        if (currentBlock.changeType !== line.type) {
          currentBlock.changeType = 'mixed';
        }
      } else {
        // Not consecutive, save previous block
        if (currentBlock.lineCount >= 2) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          startIndex: i,
          endIndex: i,
          lineCount: 1,
          changeType: line.type,
        };
      }
    }
  }

  // Save last block
  if (currentBlock && currentBlock.lineCount >= 2) {
    blocks.push(currentBlock);
  }

  return blocks;
}
```

### Patch Generation Strategy

#### For Single Line Revert

```typescript
/**
 * Generates a Git patch to revert a single line change
 */
function generateSingleLineRevertPatch(
  filePath: string,
  lineNumber: number,
  changeType: 'add' | 'delete' | 'modify',
  originalLine: string,
  newLine: string
): string {
  // Build unified diff format patch
  let patch = `diff --git a/${filePath} b/${filePath}\n`;
  patch += `--- a/${filePath}\n`;
  patch += `+++ b/${filePath}\n`;

  if (changeType === 'add') {
    // Remove the added line
    patch += `@@ -${lineNumber},1 +${lineNumber},0 @@\n`;
    patch += `-${newLine}\n`;
  } else if (changeType === 'delete') {
    // Restore the deleted line
    patch += `@@ -${lineNumber},0 +${lineNumber},1 @@\n`;
    patch += `+${originalLine}\n`;
  } else if (changeType === 'modify') {
    // Replace new line with original
    patch += `@@ -${lineNumber},1 +${lineNumber},1 @@\n`;
    patch += `-${newLine}\n`;
    patch += `+${originalLine}\n`;
  }

  return patch;
}
```

#### For Bulk Line Revert

```typescript
/**
 * Generates a Git patch to revert multiple consecutive lines
 */
function generateBulkLineRevertPatch(
  filePath: string,
  startLine: number,
  endLine: number,
  lines: Array<{ original: string; new: string; type: string }>
): string {
  const lineCount = endLine - startLine + 1;
  let patch = `diff --git a/${filePath} b/${filePath}\n`;
  patch += `--- a/${filePath}\n`;
  patch += `+++ b/${filePath}\n`;
  patch += `@@ -${startLine},${lineCount} +${startLine},${lineCount} @@\n`;

  for (const line of lines) {
    if (line.type === 'add') {
      patch += `-${line.new}\n`;
    } else if (line.type === 'delete') {
      patch += `+${line.original}\n`;
    } else if (line.type === 'modify') {
      patch += `-${line.new}\n`;
      patch += `+${line.original}\n`;
    }
  }

  return patch;
}
```

### Backend API Additions

#### New Go Service Methods

```go
// RevertLineChanges reverts a single line change in a file
func (s *StagingService) RevertLineChanges(
    filePath string,
    lineNumber int,
    patch string,
) error {
    repo := s.repo.GetCurrentRepository()
    if repo == nil {
        return fmt.Errorf("no repository is currently open")
    }
    repoPath := repo.Path

    // Create temporary patch file
    tempPatchFile := filepath.Join(os.TempDir(), fmt.Sprintf("git-master-line-patch-%d.patch", time.Now().UnixNano()))
    defer os.Remove(tempPatchFile)

    // Write patch to temp file
    if err := os.WriteFile(tempPatchFile, []byte(patch), 0644); err != nil {
        return fmt.Errorf("failed to write patch file: %w", err)
    }

    // Apply patch using git apply
    cmd := exec.Command("git", "apply", "--whitespace=nowarn", tempPatchFile)
    cmd.Dir = repoPath

    output, err := cmd.CombinedOutput()
    if err != nil {
        return fmt.Errorf("failed to apply line revert patch: %w - %s", err, string(output))
    }

    return nil
}

// RevertLineRangeChanges reverts multiple consecutive line changes
func (s *StagingService) RevertLineRangeChanges(
    filePath string,
    startLine int,
    endLine int,
    patch string,
) error {
    // Similar to RevertLineChanges but handles multiple lines
    return s.RevertLineChanges(filePath, startLine, patch)
}

// ValidateLineRevertPatch validates a patch before applying
func (s *StagingService) ValidateLineRevertPatch(
    filePath string,
    patch string,
) error {
    repo := s.repo.GetCurrentRepository()
    if repo == nil {
        return fmt.Errorf("no repository is currently open")
    }
    repoPath := repo.Path

    // Create temporary patch file
    tempPatchFile := filepath.Join(os.TempDir(), fmt.Sprintf("git-master-validate-patch-%d.patch", time.Now().UnixNano()))
    defer os.Remove(tempPatchFile)

    if err := os.WriteFile(tempPatchFile, []byte(patch), 0644); err != nil {
        return fmt.Errorf("failed to write patch file: %w", err)
    }

    // Check if patch can be applied (dry run)
    cmd := exec.Command("git", "apply", "--check", tempPatchFile)
    cmd.Dir = repoPath

    output, err := cmd.CombinedOutput()
    if err != nil {
        return fmt.Errorf("patch validation failed: %w - %s", err, string(output))
    }

    return nil
}
```

### UI Design Specifications

#### Button Appearance

**Single Line Revert Button**:
- Icon: ChevronsRight (14px)
- Background: Semi-transparent white/dark overlay
- Border: 1px solid gray-300/gray-600
- Border radius: 4px
- Padding: 4px
- Opacity: 0 (hidden) → 1 (visible on hover)
- Transition: opacity 150ms ease-in-out
- Position: Absolute, right: 8px, top: 50% transform: translateY(-50%)
- Hover state: Background color darkens slightly
- Active state: Scale down to 0.95

**Bulk Line Revert Button**:
- Same as single line button plus:
- Badge showing line count (e.g., "5")
- Badge position: top-right of button
- Badge background: blue-500
- Badge text: white, 10px, bold
- Slightly larger button (padding: 6px)

**Color Scheme**:
- Light mode:
  - Button background: rgba(255, 255, 255, 0.9)
  - Button border: #D1D5DB
  - Button icon: #374151
  - Button hover background: rgba(243, 244, 246, 1)
  - Badge background: #3B82F6

- Dark mode:
  - Button background: rgba(31, 41, 55, 0.9)
  - Button border: #4B5563
  - Button icon: #D1D5DB
  - Button hover background: rgba(55, 65, 81, 1)
  - Badge background: #60A5FA

#### Hover Highlight

When hovering over bulk revert button:
- All lines in the block get subtle highlight
- Highlight color (light mode): rgba(59, 130, 246, 0.1)
- Highlight color (dark mode): rgba(96, 165, 250, 0.1)
- Transition: background-color 150ms ease-in-out

#### Confirmation Dialog

For bulk reverts of 6+ lines:
```
Title: "Revert Multiple Lines"
Message: "You are about to revert {count} consecutive lines. This action cannot be undone."
Actions:
  - Cancel (secondary button)
  - Revert (danger button)
Show: List of affected line numbers (e.g., "Lines 45-52")
```

### Performance Optimizations

#### 1. Memoization
- Memoize consecutive block detection results
- Cache patch generation for identical line combinations
- Use React.memo for InlineRevertButton component

#### 2. Debouncing
- Debounce hover state updates (50ms)
- Debounce consecutive block recalculation

#### 3. Virtual Scrolling Integration
- Ensure InlineRevertButton works with @tanstack/react-virtual
- Only render buttons for visible lines
- Clean up event listeners for off-screen lines

#### 4. Batch Operations
- Group multiple single-line reverts into one backend call if triggered in quick succession
- Use request deduplication to prevent duplicate API calls

## Implementation Phases

### Phase 1: Core Backend Support (7-8 hours)
**Estimated Time:** 7-8 hours
**Tasks:** 3 tasks
**Description:** Implement backend services for line-level revert operations using Git patches

**Deliverables**:
- New Go service methods in StagingService
- Patch generation and validation logic
- Error handling for edge cases
- Unit tests for backend services

### Phase 2: Patch Generation Utilities (6-7 hours)
**Estimated Time:** 6-7 hours
**Tasks:** 2 tasks
**Description:** Create TypeScript utilities for generating Git patches from diff data

**Deliverables**:
- Single line patch generator
- Bulk line patch generator
- Patch validation on frontend
- TypeScript types for patch operations

### Phase 3: Consecutive Line Detection (5-6 hours)
**Estimated Time:** 5-6 hours
**Tasks:** 2 tasks
**Description:** Implement algorithm to detect and group consecutive changed lines

**Deliverables**:
- Consecutive block detection utility
- Integration with diff parsing
- Caching mechanism for performance
- Edge case handling

### Phase 4: State Management (5-6 hours)
**Estimated Time:** 5-6 hours
**Tasks:** 2 tasks
**Description:** Create Zustand store for revert operations and hover state

**Deliverables**:
- New revertStore with all necessary state
- Actions for hover, pending operations, history
- Integration with existing stores
- State persistence for revert history

### Phase 5: UI Components (8-10 hours)
**Estimated Time:** 8-10 hours
**Tasks:** 3 tasks
**Description:** Build React components for inline revert buttons

**Deliverables**:
- InlineRevertButton component
- DiffLineWithRevert wrapper component
- Hover detection and management
- Animations and transitions

### Phase 6: Integration with FullFileSplitDiffViewer (7-8 hours)
**Estimated Time:** 7-8 hours
**Tasks:** 2 tasks
**Description:** Integrate new components into existing diff viewer

**Deliverables**:
- Modified FullFileSplitDiffViewer component
- Proper data flow setup
- Event handling and callbacks
- Virtual scrolling compatibility

### Phase 7: Confirmation Dialogs & Error Handling (5-6 hours)
**Estimated Time:** 5-6 hours
**Tasks:** 2 tasks
**Description:** Implement confirmation dialogs and comprehensive error handling

**Deliverables**:
- Confirmation dialog for bulk reverts
- Error boundary components
- Toast notifications
- Recovery mechanisms

### Phase 8: Testing & Polish (6-8 hours)
**Estimated Time:** 6-8 hours
**Tasks:** 3 tasks
**Description:** Test all functionality and polish UI/UX

**Deliverables**:
- Integration tests
- Manual testing of all scenarios
- Performance testing and optimization
- Accessibility improvements
- Documentation

## Technical Considerations

### Frontend Best Practices

**Component Organization**:
- Keep components under 500 lines
- Extract complex logic into custom hooks
- Use full descriptive variable names
- Follow SOLID principles

**State Management**:
- Minimize re-renders with proper memoization
- Use Zustand selectors for performance
- Separate concerns between stores

**Error Handling**:
- Graceful degradation for all failures
- Clear error messages with recovery actions
- Logging for debugging

**Styling**:
- Use Tailwind CSS utility classes
- Follow existing color scheme
- Ensure responsive design
- Support dark mode

### Backend Best Practices

**Git Operations**:
- Validate all file paths
- Use temporary files for patches
- Clean up temporary resources
- Handle git command errors

**Security**:
- Sanitize all user inputs
- Prevent directory traversal
- Limit file size for operations
- Rate limit API calls

**Performance**:
- Use efficient git commands
- Minimize file system operations
- Cache when appropriate

### Code Quality Standards

**TypeScript**:
- No any types
- Proper interface definitions
- Strict null checks
- Exhaustive switch statements

**Testing**:
- Unit tests for utilities
- Integration tests for workflows
- Manual testing for UI interactions

**Documentation**:
- JSDoc comments for public APIs
- README for new utilities
- Inline comments for complex logic

## Risk Mitigation

### Identified Risks

1. **Git Apply Failures**: Patches may not apply cleanly in all scenarios
   - **Mitigation**: Validate patches before applying, provide fallback to file-level revert

2. **Performance Issues**: Large files may cause UI lag
   - **Mitigation**: Virtual scrolling, debouncing, memoization, lazy loading

3. **State Synchronization**: Frontend and backend state may diverge
   - **Mitigation**: Optimistic updates with rollback, periodic refresh

4. **User Confusion**: Complex interactions may confuse users
   - **Mitigation**: Clear visual feedback, tooltips, onboarding hints

5. **Edge Case Bugs**: Unusual diff scenarios may cause issues
   - **Mitigation**: Comprehensive testing, error boundaries, graceful degradation

### Testing Strategy

**Unit Tests**:
- Patch generation functions
- Consecutive block detection
- State management actions

**Integration Tests**:
- Full revert workflow
- Error scenarios
- State synchronization

**Manual Tests**:
- All user interactions
- Visual appearance in both themes
- Performance with large files
- Accessibility features

## Future Enhancements

1. **Undo Revert**: Allow users to undo recent revert operations
2. **Keyboard Shortcuts**: Add hotkeys for common revert actions
3. **Hunk-Level Revert**: Support reverting entire change hunks
4. **Revert History Panel**: Show history of all revert operations
5. **Custom Confirmation Thresholds**: Let users configure when to show confirmations
6. **Batch Operations**: Select multiple non-consecutive lines for bulk revert
7. **Preview Mode**: Show what file will look like after revert before applying
8. **Smart Suggestions**: AI-powered suggestions for which lines to revert
