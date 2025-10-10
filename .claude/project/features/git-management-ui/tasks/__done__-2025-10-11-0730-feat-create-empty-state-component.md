# Create Empty State Component

## Type
feat

## Description
Create a reusable EmptyState component to display when there's no data to show (e.g., no commits, no repository open, no changes). Component should accept title, description, icon, and optional action button.

## Acceptance Criteria
- [x] `components/common/EmptyState.tsx` component created
- [x] Accepts props: `title`, `description`, `icon` (React element), `action` (optional button)
- [x] Centered vertically and horizontally in container
- [x] Icon, title, description layout is visually balanced
- [x] Optional action button with customizable text and onClick
- [x] Responsive design works on all screen sizes
- [x] Component is reusable across different views
- [x] Follows Tailwind styling conventions
- [x] No type errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details
- **File to create**: `frontend/src/components/common/EmptyState.tsx`

- **Implementation**:
  ```typescript
  import type { ReactNode } from 'react';

  interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }

  export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center max-w-md px-6">
          {icon && (
            <div className="flex justify-center mb-4 text-gray-400">
              {icon}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 mb-6">
            {description}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    );
  }
  ```

- **Usage example**:
  ```typescript
  import { FolderOpen } from 'lucide-react';
  import { EmptyState } from '@/components/common/EmptyState';

  <EmptyState
    icon={<FolderOpen className="w-16 h-16" />}
    title="No repository open"
    description="Open a Git repository to start managing your code"
    action={{
      label: 'Open Repository',
      onClick: handleOpenRepo,
    }}
  />
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0445-chore-create-project-folder-structure.md

## Notes
- EmptyState should be used in all views when there's no data
- Icon size should be consistent (e.g., `w-16 h-16`)
- Component should center itself using parent's height (use `h-full`)
- Action button is optional; some empty states may not need actions
- Consider adding multiple action buttons support in future
