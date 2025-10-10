# Create Loading Spinner Component

## Type
feat

## Description
Create a reusable loading spinner component for indicating asynchronous operations. Component should support different sizes and optional loading text. Use CSS animations for smooth spinning effect.

## Acceptance Criteria
- [x] `components/common/Spinner.tsx` component created
- [x] Accepts props: `size` ('sm', 'md', 'lg'), `text` (optional string)
- [x] Smooth CSS animation (rotate 360deg)
- [x] Multiple size variants: sm (16px), md (24px), lg (48px)
- [x] Optional text displays below spinner
- [x] Can be centered in container or inline
- [x] Accessible with ARIA attributes
- [x] Uses Tailwind for styling
- [x] No type errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details
- **File to create**: `frontend/src/components/common/Spinner.tsx`

- **Implementation**:
  ```typescript
  interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
  }

  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-12 h-12 border-4',
  };

  export function Spinner({ size = 'md', text, className = '' }: SpinnerProps) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div
          className={`${sizeClasses[size]} border-gray-300 border-t-primary rounded-full animate-spin`}
          role="status"
          aria-label="Loading"
        />
        {text && (
          <p className="mt-2 text-sm text-gray-600">{text}</p>
        )}
      </div>
    );
  }
  ```

- **Usage examples**:
  ```typescript
  // Small inline spinner
  <Spinner size="sm" />

  // Medium spinner with text
  <Spinner text="Loading commits..." />

  // Large centered spinner
  <div className="flex items-center justify-center h-full">
    <Spinner size="lg" text="Opening repository..." />
  </div>
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0445-chore-create-project-folder-structure.md

## Notes
- Use Tailwind's `animate-spin` utility for rotation animation
- Border trick: transparent borders with colored top border creates spinner effect
- ARIA role="status" and aria-label for screen reader accessibility
- Component should work both as centered full-page loader and inline indicator
- Consider adding color variants (primary, success, danger) in future
