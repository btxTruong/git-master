# Create BranchList Component

## Type
feat

## Description
Create the BranchList component that displays all local and remote branches with current branch highlighting, ahead/behind indicators, and branch status information.

## Acceptance Criteria
- [x] `components/branch/BranchList.tsx` component created
- [x] Lists local branches
- [x] Lists remote branches separately
- [x] Current branch highlighted
- [x] Shows ahead/behind commit counts
- [x] Branch context menu on right-click
- [x] Loading state while fetching branches
- [x] Empty state for no branches
- [x] Search/filter functionality

## Technical Details
- **File to create**: `frontend/src/components/branch/BranchList.tsx`

- **Implementation**:
  ```typescript
  import { useBranchStore } from '@/stores/branchStore';
  import { BranchItem } from './BranchItem';
  import { BranchTree } from './BranchTree';

  export function BranchList() {
    const { branches, currentBranch, isLoading } = useBranchStore();

    if (isLoading) {
      return <div className="p-4 text-center">Loading branches...</div>;
    }

    const localBranches = branches.filter(b => !b.isRemote);
    const remoteBranches = branches.filter(b => b.isRemote);

    return (
      <div className="branch-list h-full overflow-auto">
        <BranchTree
          localBranches={localBranches}
          remoteBranches={remoteBranches}
          currentBranch={currentBranch}
        />
      </div>
    );
  }
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-1645-feat-create-branch-store.md

## Notes
- Branches should be grouped by local/remote
- Current branch should have distinct visual indicator
- Consider adding "New Branch" button at top
