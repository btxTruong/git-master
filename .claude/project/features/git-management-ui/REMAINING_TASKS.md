# Remaining Tasks

This document tracks tasks that have not yet been created as individual task files. There are **72 remaining tasks** across Phases 1-5.

## Phase 1: Foundation & Setup (3 remaining tasks)

**Remaining tasks** (tasks 21-23):
1. Create CommitList component with virtualization
2. Create CommitItem component for individual commit rows
3. Create commit search/filter functionality
4. Integrate commit list into HistoryView
5. Test end-to-end: open repo → browse 1000+ commits

**Estimated time**: 8-10 hours

---

## Phase 2: Core Viewing Features (18 tasks)

**All tasks remaining** (tasks 24-41):

### Diff Viewer (6 tasks)
1. Create DiffViewer container component
2. Create UnifiedDiff component
3. Create SplitDiff component
4. Integrate syntax highlighting with react-syntax-highlighter
5. Implement collapsible sections for unchanged code
6. Handle binary file detection and display

### File Tree (4 tasks)
7. Create FileTree component with hierarchical structure
8. Create FileItem component with change indicators
9. Build file tree utility function (flat list → tree)
10. Integrate file tree into commit detail panel

### Commit Detail (3 tasks)
11. Create CommitDetail component showing metadata
12. Display file changes list with diff stats
13. Connect commit selection to diff viewer

### Branch List (3 tasks)
14. Create basic BranchList component
15. Display local and remote branches
16. Highlight current branch

### Search/Filtering (2 tasks)
17. Implement search debouncing hook
18. Connect search/filter UI to commit store

**Estimated time**: 30-35 hours

---

## Phase 3: Basic Git Operations (20 tasks)

**All tasks remaining** (tasks 42-61):

### Staging Area (5 tasks)
1. Create StagingArea container component
2. Create FileTree for changed files (staged/unstaged/untracked)
3. Implement stage/unstage file actions
4. Create stage all / unstage all buttons
5. Display staging diff preview

### Commit Dialog (4 tasks)
6. Create CommitDialog component
7. Implement commit message editor with React Hook Form
8. Add commit message validation
9. Implement amend commit functionality

### Branch Operations (6 tasks)
10. Create CreateBranchDialog component
11. Implement branch creation with validation
12. Create DeleteBranchDialog with safety checks
13. Implement branch checkout (switch)
14. Add dirty working directory detection
15. Implement branch renaming

### Pull/Push Operations (3 tasks)
16. Create pull/push action buttons
17. Implement progress indicators for network operations
18. Add error handling with user-friendly messages

### Error Handling (2 tasks)
19. Set up toast notification system (react-hot-toast)
20. Implement error boundary for critical sections

**Estimated time**: 35-40 hours

---

## Phase 4: Advanced Operations (16 tasks)

**All tasks remaining** (tasks 62-77):

### Merge Functionality (4 tasks)
1. Create MergeDialog for selecting source branch
2. Implement merge operation with conflict detection
3. Add merge status indicators in UI
4. Implement abort merge functionality

### Conflict Resolver (6 tasks)
5. Create ConflictList component showing all conflicts
6. Create ConflictResolver three-pane editor
7. Create ConflictPane component for base/ours/theirs
8. Implement "Accept Ours" and "Accept Theirs" actions
9. Add manual conflict resolution editing
10. Track resolution status per file

### Stash Management (3 tasks)
11. Create stash list component
12. Implement stash save/apply/drop operations
13. Display stash metadata (branch, date, message)

### Advanced Operations (3 tasks)
14. Implement cherry-pick functionality
15. Implement basic rebase (no interactive)
16. Implement reset (soft/hard) with confirmation

**Estimated time**: 30-35 hours

---

## Phase 5: Polish & Optimization (15 tasks)

**All tasks remaining** (tasks 78-92):

### Commit Graph Visualization (4 tasks)
1. Design commit graph algorithm (parent-child relationships)
2. Implement SVG-based graph rendering
3. Add branch line colors and merge indicators
4. Integrate graph into CommitList

### Keyboard Shortcuts (3 tasks)
5. Create useKeyboardShortcut hook
6. Implement global shortcuts (Cmd+K commit, Cmd+P pull, Cmd+Shift+P push)
7. Add shortcut help overlay (Cmd+? or F1)

### Settings Panel (3 tasks)
8. Create SettingsView with theme selector
9. Add user preferences (diff mode, author name/email)
10. Implement settings persistence to localStorage

### Performance Optimization (3 tasks)
11. Audit and optimize render performance with React DevTools
12. Implement code splitting for heavy components
13. Add performance metrics tracking

### Testing (2 tasks)
14. Write unit tests for stores and utilities (80%+ coverage)
15. Write component tests for critical components (CommitList, DiffViewer, BranchTree)

**Estimated time**: 25-30 hours

---

## How to Generate Remaining Tasks

When you're ready to proceed with a specific phase, use this PRD and Implementation Plan to generate the remaining task files. Each task should follow the same format as the first 20 tasks:

```markdown
# Task Title

## Type
feat/fix/style/refactor/test/docs/chore

## Description
[Clear description]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Details
[Implementation guidance, code examples]

## Estimated Time
X hours

## Dependencies
- Depends on: [task file name]

## Notes
[Additional context]
```

---

## Task Naming Convention

Use the format: `YYYY-MM-DD-HHMM-{type}-{description}.md`

**Types**: feat, fix, style, refactor, test, docs, chore

**Example**: `2025-10-11-0830-feat-create-commit-list-virtualization.md`

---

## Total Project Estimate

- **Phase 1**: 35-40 hours (first 20 tasks completed, 3 remaining)
- **Phase 2**: 30-35 hours (18 tasks remaining)
- **Phase 3**: 35-40 hours (20 tasks remaining)
- **Phase 4**: 30-35 hours (16 tasks remaining)
- **Phase 5**: 25-30 hours (15 tasks remaining)

**Total**: 155-180 hours (approximately 5 weeks at 30-35 hours/week)

---

## Notes

- First 20 tasks provide complete foundation and basic UI layout
- Remaining tasks build incrementally on top of foundation
- Each phase is self-contained and delivers a working feature set
- Tasks can be worked on in parallel within a phase (e.g., multiple developers)
- Testing tasks are at the end but should be done continuously during development
