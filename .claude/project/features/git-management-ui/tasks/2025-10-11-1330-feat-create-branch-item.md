# Create BranchItem Component

## Type
feat

## Description
Create the BranchItem component representing a single branch in the list with name, tracking status, ahead/behind indicators, and context menu for branch operations.

## Acceptance Criteria
- [ ] `components/branch/BranchItem.tsx` component created
- [ ] Shows branch name and icon
- [ ] Displays tracking remote branch
- [ ] Shows ahead/behind commit indicators
- [ ] Current branch badge visible
- [ ] Right-click context menu
- [ ] Click to checkout branch
- [ ] Hover effects

## Technical Details
- **File to create**: `frontend/src/components/branch/BranchItem.tsx`

- **Implementation**:
  ```typescript
  import { GitBranch, Check } from 'lucide-react';
  import type { Branch } from '@/types/git';

  interface BranchItemProps {
    branch: Branch;
    isCurrent: boolean;
    onCheckout: (name: string) => void;
  }

  export function BranchItem({ branch, isCurrent, onCheckout }: BranchItemProps) {
    return (
      <div
        className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 ${
          isCurrent ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        onClick={() => !isCurrent && onCheckout(branch.name)}
      >
        <GitBranch className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-sm font-medium">{branch.name}</span>
        {isCurrent && <Check className="w-4 h-4 text-blue-600" />}
        {branch.ahead > 0 && (
          <span className="text-xs text-green-600">↑{branch.ahead}</span>
        )}
        {branch.behind > 0 && (
          <span className="text-xs text-red-600">↓{branch.behind}</span>
        )}
      </div>
    );
  }
  ```

## Estimated Time
1.5 hours

## Dependencies
- Depends on: 2025-10-11-1315-feat-create-branch-list.md

## Notes
- Context menu should offer: Checkout, Delete, Rename, Merge
- Ahead/behind indicators show tracking status
