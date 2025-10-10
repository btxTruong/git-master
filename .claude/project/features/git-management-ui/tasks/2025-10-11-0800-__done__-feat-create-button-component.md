# Create Reusable Button Component

## Type
feat

## Description
Create a reusable Button component with multiple variants (primary, secondary, danger, ghost), sizes (sm, md, lg), and states (loading, disabled). Component should be type-safe and follow consistent design patterns.

## Acceptance Criteria
- [x] `components/common/Button.tsx` component created
- [x] Supports variants: primary, secondary, danger, ghost
- [x] Supports sizes: sm, md, lg
- [x] Loading state shows spinner and disables button
- [x] Disabled state has appropriate styling
- [x] Accepts all standard button HTML attributes
- [x] Icon support (left or right of text)
- [x] Fully typed with TypeScript
- [x] Keyboard accessible (focus visible)
- [x] No type errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details
- **File to create**: `frontend/src/components/common/Button.tsx`

- **Implementation**:
  ```typescript
  import type { ButtonHTMLAttributes, ReactNode } from 'react';
  import { Spinner } from './Spinner';

  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
  }

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-blue-700 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-danger text-white hover:bg-red-700 disabled:bg-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = '',
    ...props
  }: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
      <button
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded transition-colors
          disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span>{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
  ```

- **Usage examples**:
  ```typescript
  import { Save, Trash2 } from 'lucide-react';

  <Button>Primary Button</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="danger" leftIcon={<Trash2 />}>Delete</Button>
  <Button loading>Saving...</Button>
  <Button disabled>Disabled</Button>
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0745-feat-create-spinner-component.md

## Notes
- Button extends native HTML button attributes for flexibility
- Loading state automatically shows spinner and disables button
- Focus ring improves keyboard accessibility
- Icon support allows for icon-only buttons or buttons with text and icons
- Consider adding fullWidth prop in future for responsive layouts
