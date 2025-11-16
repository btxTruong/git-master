# Task: Create InlineRevertButton Component

## Description
Build the React component that displays the revert button (ChevronsRight icon) for single lines or consecutive blocks. The button should have elegant hover animations, proper positioning, and support both single line and bulk revert modes with appropriate visual indicators.

## Acceptance Criteria
- [ ] InlineRevertButton component created with proper TypeScript types
- [ ] ChevronsRight icon from lucide-react integrated
- [ ] Button appears with smooth fade-in animation on hover (150ms)
- [ ] Button positioned absolutely to the right of line content
- [ ] Supports both single line and bulk modes
- [ ] Bulk mode shows badge with line count
- [ ] Hover and active states styled appropriately
- [ ] Accessible with keyboard navigation (Tab, Enter, Space)
- [ ] ARIA labels added for screen readers
- [ ] Works in both light and dark themes
- [ ] No layout shift when button appears/disappears
- [ ] Button disabled state handled for pending operations

## Technical Considerations
- Use absolute positioning to avoid layout shifts
- Use CSS transitions for smooth animations
- Implement proper event handlers (onClick, onMouseEnter, onMouseLeave)
- Prevent event bubbling to parent elements
- Use z-index to ensure button stays above content
- Support keyboard navigation with proper focus indicators
- Use Tailwind CSS for styling consistency
- Extract button size/padding to constants
- Memoize component to prevent unnecessary re-renders
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants (BUTTON_FADE_DURATION_MS, BUTTON_SIZE_PX)
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 008 (revert store)
- Blocks: 011

## Estimated Effort
6-7 hours

## Implementation Notes

### File Location
Create new file: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/InlineRevertButton.tsx`

### Component Props
```typescript
interface InlineRevertButtonProps {
  lineIndex: number;
  changeType: 'add' | 'delete' | 'modify';
  isBulkMode?: boolean;
  bulkLineCount?: number;
  onRevert: () => Promise<void>;
  isVisible: boolean;
  isPending?: boolean;
  className?: string;
}
```

### Styling Constants
```typescript
const BUTTON_FADE_DURATION_MS = 150;
const BUTTON_SIZE_PX = 28;
const BUTTON_ICON_SIZE_PX = 14;
const BADGE_SIZE_PX = 16;
const BUTTON_RIGHT_OFFSET_PX = 8;
```

### Component Structure
```tsx
export const InlineRevertButton = React.memo<InlineRevertButtonProps>(
  ({ lineIndex, isBulkMode, bulkLineCount, onRevert, isVisible, isPending }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsLoading(true);
      try {
        await onRevert();
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <button
        className={/* Tailwind classes */}
        onClick={handleClick}
        disabled={isPending || isLoading}
        aria-label={isBulkMode ? `Revert ${bulkLineCount} lines` : 'Revert line'}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${BUTTON_FADE_DURATION_MS}ms ease-in-out`,
        }}
      >
        <ChevronsRight size={BUTTON_ICON_SIZE_PX} />
        {isBulkMode && bulkLineCount && (
          <span className="badge">{bulkLineCount}</span>
        )}
      </button>
    );
  }
);
```

### Styling
- Light mode: bg-white/90, border-gray-300, text-gray-700
- Dark mode: bg-gray-800/90, border-gray-600, text-gray-200
- Hover: slightly darker background
- Active: scale(0.95)
- Focus: ring-2 ring-blue-500
- Disabled: opacity-50, cursor-not-allowed

### Accessibility
- Keyboard navigable with Tab
- Activatable with Enter or Space
- ARIA label describes action
- Focus visible with ring indicator
- Disabled state prevents interaction

### Testing Strategy
- Test rendering in both modes (single/bulk)
- Test animations work smoothly
- Test click handler called correctly
- Test disabled state prevents clicks
- Test keyboard navigation
- Test theme switching
