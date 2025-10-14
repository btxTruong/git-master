# Working Changes Feature

## Overview
The Working Changes feature provides changelist functionality similar to JetBrains IDEs, allowing users to organize their working directory changes into logical groups. This enables better workflow management for developers working on multiple tasks simultaneously.

## User Stories
- As a developer, I want to group my file changes by feature/task so that I can keep my work organized
- As a developer, I want to archive groups of changes as patches so that I can save work-in-progress for later
- As a developer, I want to move files between groups so that I can reorganize my work as needed
- As a developer, I want to view diffs for specific groups so that I can review related changes together
- As a developer, I want to commit only files from a specific group so that I can create focused commits
- As a developer, I want to restore archived changes so that I can resume previously saved work
- As a developer, I want to see which files are tracked (staged) vs untracked so that I understand my Git state

## Requirements

### Functional Requirements

#### Core Changelist Management
1. **Default Groups**
   - Tracked: Automatically populated with staged files (Git index)
   - Untracked: Automatically populated with untracked files
   - Both default groups are derived from Git status and never persisted

2. **Custom Groups**
   - Users can create unlimited custom groups with descriptive names
   - Custom groups contain file paths (metadata only)
   - Files can belong to multiple groups simultaneously
   - Moving files between groups updates metadata only (no Git operations)
   - Custom groups persist across application restarts

3. **File Operations**
   - Move files between custom groups (metadata update only)
   - Move files to "Tracked" group (stages files via `git add`)
   - Move files out of "Tracked" group (unstages files via `git reset HEAD`)
   - Rename groups
   - Delete groups (with optional archive before delete)

#### Context Menu Actions

**Per-File Actions:**
- **Revert**: Discard file changes (tracked/untracked/modified)
- **Commit**: Stage file(s) and open commit modal
- **Diff**: Display file changes vs current branch
- **Move to Group**: Transfer file to different group
- **Git Blame**: Show blame information
- **History**: Display file change history
- **Create Patch**: Export file as diff patch

**Per-Group Actions:**
- **Archive Group**: Save group as `.diff` file in `~/.git-master/{repo-name}/{archive_name}.diff`
- **Commit Group**: Stage all files in group and open commit modal
- **Create Patch**: Export entire group as patch
- **Add Group**: Create new custom group
- **Edit Group**: Rename group
- **Delete Group**: Remove group (with optional archive)

#### Archive Management

**Archive Creation:**
- Archives stored in `~/.git-master/{repo-name}/{archive_name}.diff`
- Metadata stored in `~/.git-master/{repo-name}/{archive_name}.meta.json`
- Supports staged, modified, and untracked files
- Binary file support
- Preserves file renames and deletions

**Archive Restoration:**
- Preflight check before applying (`git apply --check`)
- Optional backup of affected files via stash
- Three-way merge support when possible
- Fallback to reject files on conflicts
- Non-destructive by default (working tree only, no index modification)

**Archive Metadata:**
- Creation timestamp
- Repository name and path
- Branch name and HEAD commit
- Source group ID and name
- List of included file paths
- Diff source type (index/working/mixed)
- Application version

#### UI Structure

**Tab 1 - Changes:**
- Display all groups (default + custom)
- File tree within each group
- File count badges
- Expand/collapse groups
- Drag-and-drop file movement (future enhancement)
- Context menu on files and groups
- Diff preview pane

**Tab 2 - Archives:**
- List all archived groups for current repository
- Archive metadata display (date, branch, file count)
- Context menu actions:
  - **UnArchive**: Apply archive to working tree
  - **Create Group from Archive**: Import as custom group without applying
  - **Diff**: View archived changes
  - **Create Patch**: Export archive as patch
  - **Rename**: Rename archive
  - **Delete**: Remove archive

### Non-Functional Requirements

#### Performance
- Support repositories with 1000+ changed files
- Group operations complete in <100ms
- Diff generation lazy-loaded on demand
- Virtualized file lists for groups with 50+ files
- Archive creation for groups with 100 files completes in <5s

#### Reliability
- Atomic file operations (no partial writes)
- Lock file mechanism for concurrent access prevention
- Automatic reconciliation on Git state changes
- No data loss on application crash
- Safe rollback for failed operations

#### Usability
- Intuitive drag-and-drop interface (future)
- Keyboard shortcuts for common actions
- Real-time Git status updates
- Clear error messages with actionable suggestions
- Visual indicators for file states (staged, modified, untracked)

#### Security
- Path traversal prevention
- Safe handling of binary files
- No execution of user-provided content
- Secure temporary file handling
- Proper permissions on archived files

#### Cross-Platform Compatibility
- Works on macOS, Windows, Linux
- Handles path separators correctly
- Respects Git configuration (CRLF, quotepath)
- OS-specific trash integration for deletions

## Acceptance Criteria

### Changelist Management
- [ ] Default "Tracked" group displays all staged files
- [ ] Default "Untracked" group displays all untracked files
- [ ] Users can create custom groups with unique names
- [ ] Users can rename custom groups
- [ ] Users can delete custom groups
- [ ] Files can be added to multiple groups
- [ ] Moving files between custom groups preserves Git state
- [ ] Moving files to "Tracked" stages them in Git
- [ ] Moving files from "Tracked" unstages them in Git
- [ ] Custom groups persist across application restarts

### Archive Operations
- [ ] Archives are created as valid Git patches
- [ ] Archive metadata is stored as JSON
- [ ] Archives can be restored to working tree
- [ ] Restore operation performs preflight checks
- [ ] Failed restore operations don't corrupt working tree
- [ ] Archives list displays all archives for current repo
- [ ] Archives can be renamed
- [ ] Archives can be deleted
- [ ] Archives can be exported as patches

### Context Menu Actions
- [ ] Revert removes file changes correctly
- [ ] Commit stages selected files and opens commit dialog
- [ ] Diff displays accurate file changes
- [ ] Move to Group transfers files correctly
- [ ] Git Blame shows correct line annotations
- [ ] History displays file commit history
- [ ] Create Patch exports valid Git patches
- [ ] Archive Group creates valid archive files

### UI/UX
- [ ] Changes tab displays all groups correctly
- [ ] Archives tab displays all archives correctly
- [ ] File counts are accurate
- [ ] Diff preview updates when file is selected
- [ ] Context menus appear on right-click
- [ ] Keyboard shortcuts work as expected
- [ ] Loading states shown during operations
- [ ] Error states display helpful messages

### Performance
- [ ] Large file lists (500+ files) render smoothly
- [ ] Group operations complete in <100ms
- [ ] Diff generation is lazy-loaded
- [ ] Archive creation completes in reasonable time
- [ ] No memory leaks during extended use

## Edge Cases

### File System Edge Cases
1. **Renamed Files**
   - Detect via Git porcelain v2
   - Update path mappings in custom groups
   - Preserve group membership after rename
   - Show rename arrow in UI

2. **Deleted Files**
   - Keep in custom group but mark as "missing"
   - Allow archive to capture deletion
   - Provide "Clean Missing Files" action
   - Visual indicator for missing files

3. **Binary Files**
   - Use `git diff --binary` for archives
   - Display "Binary file" in diff preview
   - Support restore for binary files
   - Handle Git LFS pointers correctly

4. **Conflicted Files**
   - Mark with conflict indicator
   - Enable conflict resolution tools
   - Prevent certain operations during conflicts
   - Show conflict state in file tree

5. **Untracked Files**
   - Generate diffs using `git diff --no-index`
   - Handle files in .gitignore
   - Archive untracked files correctly
   - Restore untracked files to working tree

### Git State Edge Cases
1. **Empty Repository**
   - Handle missing HEAD gracefully
   - Disable operations requiring commits
   - Show appropriate empty states

2. **Detached HEAD**
   - Allow all operations normally
   - Show detached state in UI
   - Archive includes current HEAD OID

3. **Mid-Operation States**
   - Handle merge in progress
   - Handle rebase in progress
   - Handle cherry-pick in progress
   - Show appropriate warnings

4. **Large Files**
   - Warn for files >10MB
   - Stream large diffs
   - Consider memory limits
   - Provide progress indicators

### Concurrent Access Edge Cases
1. **Multiple Application Instances**
   - Lock file prevents corruption
   - Last-write-wins with merge
   - Show warning on lock timeout
   - Reload on external changes

2. **External Git Operations**
   - Detect index changes via fsnotify
   - Auto-refresh derived groups
   - Reconcile custom groups
   - Handle disappearing files

3. **File System Changes**
   - Watch working tree for changes
   - Debounce rapid changes
   - Update UI incrementally
   - Handle mass file operations

## Business Rules

### Group Management Rules
- Group names must be unique per repository
- Group names cannot be empty or only whitespace
- Reserved names: "tracked", "untracked", "default"
- Maximum group name length: 100 characters
- No special characters in group names except: `-`, `_`, space

### File Movement Rules
- Files moved to "Tracked" must exist in working tree
- Files moved from "Tracked" must be in Git index
- Cannot move untracked files directly to "Tracked" without staging
- Moving deleted files only updates metadata
- Cannot move files during active merge/rebase

### Archive Rules
- Archive names must be unique per repository
- Archive name sanitization for file system safety
- Archives include only files that existed at archive time
- Archives preserve original file permissions
- Maximum archive size: 100MB (warning threshold)
- Archives older than 90 days can be auto-cleaned (configurable)

### Restore Rules
- Restore requires clean working tree or explicit backup
- Restore creates backup stash if conflicts detected
- Restore does not modify Git index by default
- Restore aborts if preflight check fails without backup option
- Three-way merge attempted when base blobs available

### Commit Rules
- Commit requires non-empty message
- Commit stages only files from selected group
- Commit preserves files in other groups
- Commit updates "Tracked" group immediately after success
- Failed commits do not modify any groups

## Open Questions
- [ ] Should we support drag-and-drop file movement in v1 or defer to v2?
- [ ] Should archive auto-cleanup be enabled by default or opt-in?
- [ ] Should we support hunk-level selection within groups (v2 feature)?
- [ ] Should archives be compressed to save disk space?
- [ ] Should we implement archive search/filtering functionality?
- [ ] Should groups support nested hierarchies (folders)?

## Design References
- JetBrains IDE Changelists: https://www.jetbrains.com/help/idea/managing-changelists.html
- Git staging area documentation
- Git patch format specification
- Context menu patterns from existing app components
