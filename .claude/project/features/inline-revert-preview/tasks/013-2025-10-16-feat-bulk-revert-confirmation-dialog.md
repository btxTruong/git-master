# Task: Create Bulk Revert Confirmation Dialog

## Description
Implement a confirmation dialog that appears when users attempt to revert 6 or more consecutive lines. The dialog should clearly communicate what will be reverted, provide a way to cancel, and maintain the existing UI aesthetic. Use Radix UI Dialog for consistency with the project.

## Acceptance Criteria
- [ ] BulkRevertConfirmDialog component created
- [ ] Dialog appears when reverting 6+ lines
- [ ] Shows clear message about number of lines to revert
- [ ] Displays line range (e.g., "Lines 45-52")
- [ ] Includes Cancel and Revert buttons
- [ ] Revert button styled as danger action
- [ ] Dialog can be dismissed with Escape key
- [ ] Dialog properly manages focus
- [ ] Accessible with screen readers
- [ ] Works in both light and dark themes
- [ ] Animation matches existing dialogs in project

## Technical Considerations
- Use @radix-ui/react-dialog for consistency
- Follow existing dialog patterns in project (see RevertConfirmDialog)
- Extract threshold value to constant (BULK_REVERT_CONFIRMATION_THRESHOLD)
- Use portal to render outside parent container
- Trap focus within dialog while open
- Return focus to trigger element on close
- Prevent body scroll when dialog is open
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 011 (DiffLineWithRevert component)
- Blocks: 014

## Estimated Effort
4-5 hours

## Implementation Notes

### File Location
Create new file: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/BulkRevertConfirmDialog.tsx`

### Component Props
```typescript
interface BulkRevertConfirmDialogProps {
  isOpen: boolean;
  lineCount: number;
  startLine: number;
  endLine: number;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### Constants
```typescript
const BULK_REVERT_CONFIRMATION_THRESHOLD = 6;
```

### Component Structure
```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';

export function BulkRevertConfirmDialog({
  isOpen,
  lineCount,
  startLine,
  endLine,
  fileName,
  onConfirm,
  onCancel,
}: BulkRevertConfirmDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Revert Multiple Lines
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You are about to revert {lineCount} consecutive lines (lines {startLine}-
                {endLine}) in <span className="font-mono">{fileName}</span>. This action cannot be
                undone.
              </Dialog.Description>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  Revert {lineCount} Lines
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Integration with DiffLineWithRevert
Modify handleRevert in DiffLineWithRevert:
```typescript
const handleRevert = useCallback(async () => {
  if (isBulkMode && consecutiveBlock) {
    if (consecutiveBlock.lineCount >= BULK_REVERT_CONFIRMATION_THRESHOLD) {
      // Show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      await onRevert(consecutiveBlock.startIndex, consecutiveBlock.endIndex);
    }
  } else {
    await onRevert(lineIndex, lineIndex);
  }
}, [/* deps */]);
```

### Styling
Match existing dialog styles from project:
- Overlay: semi-transparent black backdrop
- Content: white/gray-800 background, rounded corners, shadow
- Buttons: consistent with project button styles
- Animation: fade in for overlay, scale in for content

### Testing Strategy
- Test dialog appears when threshold exceeded
- Test dialog does not appear for smaller reverts
- Test Cancel button closes dialog
- Test Revert button triggers callback
- Test Escape key dismisses dialog
- Test keyboard navigation
- Test accessibility with screen reader
