# Inline Revert Function in Working Change Preview

## Overview
Add inline revert functionality to the working change preview (DiffPreviewPane), allowing users to revert individual lines or consecutive blocks of changes directly from the split diff viewer. This feature will provide a modern, elegant interface similar to Visual Studio Code's GitLens line staging, enabling granular control over which changes to keep or discard.

## User Stories
- As a developer, I want to revert individual changed lines in a file so that I can selectively discard unwanted changes without reverting the entire file.
- As a developer, I want to revert multiple consecutive changed lines at once so that I can efficiently discard related changes in bulk.
- As a developer, I want visual feedback when hovering over changed lines so that I understand which lines I can revert.
- As a developer, I want confirmation before reverting changes so that I don't accidentally lose work.
- As a developer, I want the UI to be elegant and non-intrusive so that it doesn't clutter my diff view.

## Requirements

### Functional Requirements

#### Individual Line Revert
1. Display a ChevronsRight button on changed lines (added/modified/deleted) in the new (right) pane of the split diff viewer
2. Button should appear on hover over the changed line
3. Clicking the button should revert that specific line change
4. Support reverting additions (removes the added line)
5. Support reverting modifications (restores the original line)
6. Support reverting deletions (restores the deleted line)

#### Bulk Line Revert
1. Detect consecutive changed lines (lines that are next to each other)
2. When multiple consecutive lines are changed, show a single revert button that can revert all of them
3. Display a count indicator showing how many lines will be reverted
4. Hovering over the bulk revert button should highlight all affected lines

#### Integration with Existing System
1. Integrate with the existing FullFileSplitDiffViewer component
2. Use the backend StagingService to apply partial file reverts
3. Refresh the diff view after revert operations
4. Update the changelist state to reflect the changes
5. Show toast notifications for success/error states

#### Edge Cases
1. Handle files with mixed change types (additions, modifications, deletions)
2. Handle very long files with thousands of lines efficiently
3. Handle binary files gracefully (disable inline revert)
4. Handle files that are deleted entirely
5. Handle files that are newly added
6. Handle concurrent changes (file modified while user is viewing diff)
7. Handle network/backend errors gracefully

### Non-Functional Requirements

#### Performance
- Revert operations should complete within 500ms for files under 10,000 lines
- UI should remain responsive during revert operations
- Hover interactions should have no noticeable lag (< 100ms)
- Support files up to 50,000 lines without performance degradation

#### Accessibility
- All interactive elements must be keyboard accessible
- Provide clear focus indicators for keyboard navigation
- Support screen readers with appropriate ARIA labels
- Ensure sufficient color contrast for visibility (WCAG AA)

#### Browser Support
- Support all modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older browsers

#### User Experience
- Modern, elegant design that fits the existing UI aesthetic
- Smooth animations and transitions
- Clear visual feedback for all interactions
- Non-intrusive interface that doesn't clutter the diff view

## Acceptance Criteria

### Individual Line Revert
- [ ] ChevronsRight button appears on hover for each changed line in the new (right) pane
- [ ] Button is positioned inline with the line content
- [ ] Clicking the button reverts only that specific line
- [ ] Reverted changes are immediately reflected in the diff view
- [ ] Toast notification confirms successful revert
- [ ] Button has smooth fade-in animation on hover
- [ ] Button has appropriate hover and active states

### Bulk Line Revert
- [ ] System correctly detects consecutive changed lines
- [ ] A single bulk revert button appears for consecutive change blocks
- [ ] Button shows count of lines that will be reverted (e.g., "Revert 5 lines")
- [ ] Hovering over bulk button highlights all affected lines
- [ ] Clicking bulk button reverts all consecutive lines at once
- [ ] Confirmation dialog appears before bulk revert (configurable threshold)

### Integration & Error Handling
- [ ] Revert operations correctly apply to the working directory
- [ ] Diff view refreshes automatically after revert
- [ ] Changelist panel updates to reflect changes
- [ ] Error messages are clear and actionable
- [ ] Network errors are handled gracefully with retry option
- [ ] File not found errors show appropriate messaging
- [ ] Permission errors provide recovery suggestions

### UI/UX Quality
- [ ] Design is clean, modern, and elegant
- [ ] Fits seamlessly into existing UI aesthetic
- [ ] Animations are smooth and performant
- [ ] No layout shift when buttons appear/disappear
- [ ] Keyboard navigation works correctly
- [ ] Focus management is intuitive
- [ ] Screen reader support is functional

### Performance
- [ ] Hover interactions respond within 100ms
- [ ] Revert operations complete within 500ms for typical files
- [ ] No memory leaks during extended use
- [ ] Virtual scrolling works correctly with new features

## Edge Cases

### File State Changes
1. **File modified during viewing**: Show refresh prompt when backend detects changes
2. **File deleted by external process**: Show error and option to refresh
3. **File becomes binary**: Disable inline revert and show appropriate message
4. **Entire file is new**: Only show revert buttons on new (right) pane

### Change Type Combinations
1. **Mixed additions and deletions**: Handle each independently
2. **Modified lines followed by new lines**: Treat as separate blocks
3. **Whitespace-only changes**: Show revert button but with subtle indicator
4. **Empty line changes**: Show revert button with visual placeholder

### Concurrent Operations
1. **User reverts while another operation is pending**: Queue operations or show warning
2. **Multiple users modifying same file**: Detect conflicts and prompt refresh
3. **Backend service unavailable**: Show clear error with retry option

### UI Edge Cases
1. **Very long lines**: Ensure button doesn't cause horizontal overflow
2. **Narrow viewport**: Adjust button size/position for mobile screens
3. **High contrast mode**: Ensure sufficient contrast in all themes
4. **Reduced motion preference**: Disable animations when preferred

## Business Rules

### Revert Granularity
- Individual lines can always be reverted independently
- Consecutive lines are grouped for bulk operations but can still be reverted individually
- Bulk revert threshold: 2+ consecutive lines qualify for bulk revert button

### Confirmation Requirements
- Individual line revert: No confirmation (provide undo via toast action)
- Bulk revert (2-5 lines): No confirmation (provide undo via toast action)
- Bulk revert (6+ lines): Show confirmation dialog
- Critical files: Always show confirmation regardless of line count

### State Management
- Revert operations should immediately update local state
- Backend sync should happen asynchronously
- If backend sync fails, roll back local state and show error

### User Preferences
- Remember user's last choice for bulk revert confirmations
- Allow users to disable confirmations via settings (future enhancement)

## Open Questions

- [ ] Should we support keyboard shortcuts for revert operations (e.g., Ctrl+R for hovered line)?
- [ ] Should we provide an "undo revert" feature for recent revert operations?
- [ ] Should bulk revert button appear at the top, bottom, or both ends of consecutive blocks?
- [ ] Should we show line-by-line revert history in a side panel?
- [ ] Should we support reverting entire hunks (all changes in a change block)?
- [ ] What should be the maximum consecutive line count before requiring confirmation?

## Design References

### Visual Design Inspiration
- **Visual Studio Code GitLens**: Inline staging buttons with elegant hover states
- **GitHub Pull Request Review**: Inline comment and action buttons
- **GitKraken**: Split diff viewer with interactive elements

### Interaction Patterns
- **Hover-to-reveal**: Buttons only appear on hover to maintain clean interface
- **Progressive disclosure**: Show simple action first, reveal details on interaction
- **Immediate feedback**: Visual confirmation before backend processing
- **Graceful degradation**: Fallback to file-level revert if line-level fails

### Icon Choice
- **ChevronsRight**: Represents "restore to previous state" or "revert forward to original"
- Alternative icons considered: RotateCcw (too similar to full file revert), Undo (ambiguous direction), ArrowLeft (not descriptive enough)

## Technical Constraints

### Backend Limitations
- Git does not natively support line-level revert; we must use `git apply` with custom patches
- Partial file updates require temporary patch files
- Some edge cases may require full file rewrite

### Frontend Constraints
- Must work within Wails framework limitations
- React component tree should remain performant with additional interactive elements
- State management must coordinate between multiple stores (staging, changelist, UI)

### Security Considerations
- Validate all file paths to prevent directory traversal attacks
- Sanitize patch content to prevent command injection
- Limit file size for inline revert to prevent DoS attacks
- Rate limit revert operations to prevent abuse
