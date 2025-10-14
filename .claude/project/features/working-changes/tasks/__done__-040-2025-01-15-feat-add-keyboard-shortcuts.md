# Task: Add Keyboard Shortcuts

## Description
Implement keyboard shortcuts for common actions in the Working Changes feature for improved accessibility and power user experience.

## Acceptance Criteria
- [x] Cmd/Ctrl+N: Create new group
- [x] Cmd/Ctrl+S: Commit selected group
- [x] Cmd/Ctrl+D: View diff for selected file
- [x] Delete: Delete selected group
- [x] Escape: Close dialogs/deselect
- [x] Arrow keys: Navigate files/groups
- [x] Shortcuts listed in help dialog
- [x] Shortcuts work across tabs

## Technical Considerations
- Use existing keyboard event handling patterns
- Check for Cmd (Mac) vs Ctrl (Windows/Linux)
- Prevent conflicts with browser shortcuts
- Document shortcuts in ShortcutsHelpDialog
- Only active when Changes/Archives view focused
- Extract to useKeyboardShortcuts hook

## Dependencies
- Depends on: Existing GlobalShortcuts infrastructure
- Depends on: 022 Create changes view tab
- Depends on: 027 Create archives view tab

## Estimated Effort
3 hours
