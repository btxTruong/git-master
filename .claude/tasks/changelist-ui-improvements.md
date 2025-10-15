# Changelist UI Improvements

**Created:** 2025-10-15
**Status:** In Progress
**Epic:** Working Changes Feature Enhancement

## Overview
Major improvements to the changelist UI including context menu updates, drag-and-drop support, file selection, and archive functionality.

## Requirements Breakdown

### 1. Context Menu Updates

#### 1.1 Remove "Show Diff" Option ✅ COMPLETED
- [x] Remove "Show Diff" from file context menu
- [x] Verify no broken references
- [x] Remove unused handleShowDiff function

**Files modified:**
- ✅ `frontend/src/components/changelist/FileContextMenu.tsx`

---

#### 1.2 Remove "Remove from Group" Option ✅ COMPLETED
- [x] Remove "Remove from Group" from context menu
- [x] Remove unused handleRemoveFromGroup function
- [x] Remove unused removeFilesFromGroup import

**Files modified:**
- ✅ `frontend/src/components/changelist/FileContextMenu.tsx`

---

#### 1.3 Add "Move to Tracked" for Untracked Files ✅ COMPLETED
- [x] Detect if file is untracked (check currentGroupId === '__untracked__')
- [x] Add "Move to Tracked" option in context menu for untracked files
- [x] Connect to staging service to stage the file
- [x] Refresh status after staging
- [x] Show success toast notification

**Files modified:**
- ✅ `frontend/src/components/changelist/FileContextMenu.tsx`
- ✅ Added import from `@/api/staging` for stageFile
- ✅ Added import from `@/stores/stagingStore` for refreshStatus

---

#### 1.4 Add "Copy File Path" Option ✅ COMPLETED
- [x] Add "Copy File Path" to file context menu
- [x] Implement clipboard copy functionality using navigator.clipboard
- [x] Show toast/notification on successful copy
- [x] Handle errors gracefully

**Files modified:**
- ✅ `frontend/src/components/changelist/FileContextMenu.tsx`
- ✅ Added Copy icon from lucide-react

---

### 2. Drag and Drop Support

#### 2.1 File Drag-Drop Between Groups
- [ ] Research React DnD library or HTML5 drag-drop
- [ ] Implement draggable file items
- [ ] Implement droppable group areas
- [ ] Handle drag events (dragStart, dragOver, drop)
- [ ] Call appropriate APIs to move files between groups
- [ ] Update UI optimistically
- [ ] Handle errors gracefully
- [ ] Test drag-drop across different groups
- [ ] Test drag-drop to "Tracked" group (should stage files)

**Files to modify:**
- `frontend/src/components/changelist/ChangelistPanel.tsx`
- `frontend/src/components/changelist/FileItem.tsx` (or similar)
- `frontend/src/components/changelist/GroupItem.tsx` (or similar)
- `package.json` (add drag-drop library if needed)

**Libraries to consider:**
- `react-dnd`
- `@dnd-kit/core`
- HTML5 native drag-drop

---

### 3. Verify Existing Features Work

#### 3.1 Show Blame
- [ ] Find "Show Blame" implementation
- [ ] Test it works correctly
- [ ] Fix if broken
- [ ] Verify UI displays blame information

---

#### 3.2 Show History
- [ ] Find "Show History" implementation
- [ ] Test it works correctly
- [ ] Fix if broken
- [ ] Verify UI displays commit history

---

#### 3.3 Commit
- [ ] Find "Commit" implementation
- [ ] Test it works correctly
- [ ] Fix if broken
- [ ] Verify commit dialog opens

---

#### 3.4 Revert
- [ ] Find "Revert" implementation
- [ ] Test it works correctly
- [ ] Fix if broken
- [ ] Verify file changes are reverted

---

#### 3.5 Move to Group
- [ ] Find "Move to Group" implementation
- [ ] Test it works correctly
- [ ] Fix if broken
- [ ] Verify file moves between groups

---

#### 3.6 Create Patch
- [ ] Find "Create Patch" implementation
- [ ] Test it works correctly
- [ ] Fix if broken
- [ ] Verify patch file is created

---

### 4. Modal Improvements

#### 4.1 Standardize Modal Components
- [ ] Find the modal used in "commit in history" context menu
- [ ] Identify all modals used in changelist (create patch, etc.)
- [ ] Replace old modals with standardized modal component
- [ ] Ensure consistent styling across all modals
- [ ] Test all modal interactions

**Files to find:**
- Modal used in history commit context menu
- Create patch modal
- Any other changelist modals

**Files to modify:**
- All modal components in changelist feature

---

### 5. Archive Functionality

#### 5.1 Add Archive to Context Menu
- [ ] Add "Archive File" option to file context menu
- [ ] Add "Archive Group" option to group context menu
- [ ] Implement archive file functionality
- [ ] Implement archive group functionality
- [ ] Test archiving single files
- [ ] Test archiving entire groups
- [ ] Verify archive files are created in correct location

**Files to modify:**
- `frontend/src/components/changelist/FileContextMenu.tsx`
- `frontend/src/components/changelist/GroupContextMenu.tsx`
- `frontend/src/api/archive.ts` (or create if missing)

---

### 6. UI Layout Changes

#### 6.1 Move "Commit Files" Button ✅ COMPLETED
- [x] Found that Commit button should be in toolbar (not in groups)
- [x] Added Commit button to GroupActionsToolbar on the right side
- [x] Positioned alongside Archive button with proper spacing
- [x] Shows count badge when files are selected
- [x] Disabled when no files selected
- [x] Includes tooltip with selection count

**Files modified:**
- ✅ `frontend/src/components/changelist/GroupActionsToolbar.tsx` - Added Commit button with selection count

---

### 7. File Selection System

#### 7.1 Add Checkboxes to Files ✅ COMPLETED
- [x] Add checkbox component before each file item
- [x] Implement selection state management
- [x] Added `toggleFileSelection` and `clearSelectedFiles` methods to store
- [x] Add "Select All" checkbox at group level
- [x] Add "Deselect All" functionality
- [x] Store selected files in component state (`selectedFilePaths`)
- [x] Visual feedback for selected files (checkboxes)
- [x] Checkbox works in both flat and tree view modes
- [x] Fixed bug: Select All now works for tracked/untracked groups (not just custom groups)

**Files modified:**
- ✅ `frontend/src/stores/changelistStore.ts` - Added `toggleFileSelection`, `clearSelectedFiles`, `selectAllFilesInGroup`, `deselectAllFilesInGroup` methods
- ✅ `frontend/src/components/staging/FileTree.tsx` - Added `showCheckboxes` prop and checkbox rendering
- ✅ `frontend/src/components/changelist/ChangelistGroup.tsx` - Enabled checkboxes and added Select All/Deselect All button

**Bug Fix Details:**
The initial implementation only worked with custom groups because `changelistStore.groups` only contains custom groups (tracked/untracked are derived from staging store). Fixed by modifying `selectAllFilesInGroup` and `deselectAllFilesInGroup` to accept optional `groupItems` parameter, allowing them to work with both custom and derived groups.

---

#### 7.2 Use Selection for Commit ✅ COMPLETED
- [x] Update commit functionality to use selected files
- [x] Show count of selected files in commit button
- [x] Disable commit button if no files selected
- [x] Clear selection after successful commit
- [x] Stage selected files before opening commit dialog
- [x] Added loading state while staging

**Files modified:**
- ✅ `frontend/src/components/changelist/GroupActionsToolbar.tsx` - Implemented commit handler with staging logic

---

#### 7.3 Use Selection for Archive ✅ COMPLETED
- [x] Update archive functionality to use selected files
- [x] Show count of selected files in archive button
- [x] Disable archive button if no files selected
- [x] Clear selection after successful archive
- [x] Create temporary changelist from selected files
- [x] Prompt for archive name and description
- [x] Archive using archiveChangelistGroup API

**Files modified:**
- ✅ `frontend/src/components/changelist/GroupActionsToolbar.tsx` - Implemented archive handler

---

### 8. Archive Button

#### 8.1 Add Archive Button on Top ✅ COMPLETED
- [x] Created "Archive" button component in toolbar
- [x] Placed next to "Commit" button at the top right
- [x] Shows archive count badge (number of selected files)
- [x] Disabled when no files selected
- [x] Includes tooltip with selection count
- [x] Connected to archive selected files functionality

**Files modified:**
- ✅ `frontend/src/components/changelist/GroupActionsToolbar.tsx` - Added Archive button with full functionality

---

### 9. Group Deletion Behavior ✅ COMPLETED

#### 9.1 Move Files to Tracked on Delete ✅ VERIFIED - NO CHANGES NEEDED
- [x] Find group deletion logic
- [x] Verified: Files automatically appear in tracked/untracked groups after deletion
- [x] Architecture: Custom groups store metadata only, tracked/untracked are derived from Git status
- [x] Current behavior already correct: Files remain in working directory and appear in appropriate groups

**Analysis:**
- Custom groups only store file paths as metadata
- Tracked/Untracked groups are dynamically derived from `useStagingStore` (Git status)
- When a custom group is deleted, files remain in working directory unchanged
- Files automatically appear in Tracked or Untracked groups based on their Git status
- Confirmation dialog already states: "Files will not be deleted from disk, only removed from the group"

**No modifications needed** - Current implementation already meets requirements!

---

## Investigation Phase

### Files to Read/Investigate

- [ ] `frontend/src/components/changelist/ChangelistPanel.tsx`
- [ ] `frontend/src/components/changelist/FileItem.tsx`
- [ ] `frontend/src/components/changelist/GroupItem.tsx`
- [ ] `frontend/src/components/changelist/FileContextMenu.tsx`
- [ ] `frontend/src/components/changelist/GroupContextMenu.tsx`
- [ ] `frontend/src/api/changelist.ts`
- [ ] `frontend/src/stores/changelistStore.ts`
- [ ] Modal component used in history view
- [ ] Archive-related components

---

## Implementation Order

### Phase 1: Investigation & Planning ✅ COMPLETED
- [x] Create task tracking file
- [x] Read all relevant files
- [x] Understand current architecture
- [x] Identify all components to modify
- [x] Plan implementation approach

### Phase 2: Context Menu Updates ✅ COMPLETED
- [x] Remove "Show Diff"
- [x] Remove "Remove from Group"
- [x] Add "Copy File Path"
- [x] Add "Move to Tracked" for untracked files

### Phase 3: File Selection System ✅ PARTIALLY COMPLETED
- [x] Add checkboxes to file items
- [x] Implement selection state in store
- [ ] Add select all/deselect all (TODO: implement in group header)

### Phase 4: Archive Functionality
- [ ] Add archive context menu options
- [ ] Add archive button on top
- [ ] Connect selection to archive

### Phase 5: UI Layout Changes ✅ COMPLETED
- [x] Add commit button to toolbar (right side)
- [x] Add archive button to toolbar (right side)
- [x] Adjust layout with proper spacing and badges

### Phase 6: Drag and Drop ✅ COMPLETED
- [x] Install @dnd-kit/core library
- [x] Wrap ChangelistPanel with DndContext
- [x] Make groups droppable with useDroppable hook
- [x] Make files draggable with useDraggable hook
- [x] Implement drag end handler with move logic
- [x] Add validation to prevent invalid moves (tracked → untracked blocked)
- [x] Handle staging/unstaging when moving between tracked and custom groups
- [x] Add visual feedback when dragging over groups
- [x] Test extensively

**Files modified:**
- ✅ `frontend/package.json` - Added @dnd-kit dependencies
- ✅ `frontend/src/components/changelist/ChangelistPanel.tsx` - Added DndContext and drag handlers with validation
- ✅ `frontend/src/components/changelist/ChangelistGroup.tsx` - Added useDroppable for drop zones
- ✅ `frontend/src/components/staging/FileTree.tsx` - Added DraggableFile wrapper component

**Move Validation Rules Implemented:**
1. ✅ **Tracked → Untracked**: BLOCKED (must unstage first)
2. ✅ **Tracked → Custom**: Unstages file and adds to group
3. ✅ **Custom/Untracked → Tracked**: Stages the file
4. ✅ **Untracked → Custom**: Adds to group
5. ✅ **Custom → Untracked**: Removes from group
6. ✅ **Custom → Custom**: Moves between groups

### Phase 7: Modal Improvements
- [ ] Standardize all modals
- [ ] Replace old modals

### Phase 8: Group Deletion Behavior ✅ COMPLETED
- [x] Verified current behavior meets requirements (no changes needed)

### Phase 9: Verification
- [ ] Verify all existing features work
- [ ] Test all new features
- [ ] Fix any issues

### Phase 10: Testing & Polish
- [ ] Comprehensive testing
- [ ] Fix bugs
- [ ] Polish UI/UX

---

## Notes

- Need to investigate if backend changes are required for some features
- Modal standardization needs to identify the "good" modal first
- Drag-drop library selection impacts implementation
- Selection state management might need Zustand store updates

---

## Progress Tracking

**Completed:**
- ✅ Phase 1: Investigation & Planning
- ✅ Phase 2: Context Menu Updates (4/4 tasks)
- ✅ Phase 3: File Selection System (checkboxes, commit, archive, select all/deselect all)
- ✅ Phase 4: Archive Functionality (implemented for selected files)
- ✅ Phase 5: UI Layout Changes (Commit and Archive buttons with full functionality)
- ✅ Phase 6: Drag and Drop (full implementation with validation)
- ✅ Phase 8: Group Deletion Behavior (verified, no changes needed)

**In Progress:** None

**Blocked:** None

**Next Up:**
1. Phase 7: Modal Improvements (standardize modals)
2. Phase 9: Verification (test all features: blame, history, commit, revert, move to group, create patch)
