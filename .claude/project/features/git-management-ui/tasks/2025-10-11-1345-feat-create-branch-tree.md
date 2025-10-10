# Create BranchTree Component

## Type
feat

## Description
Create the BranchTree component that organizes branches hierarchically into collapsible groups (Local Branches, Remote Branches) with search and filter capabilities.

## Acceptance Criteria
- [ ] `components/branch/BranchTree.tsx` component created
- [ ] Groups: Local Branches, Remote Branches
- [ ] Each group expandable/collapsible
- [ ] Search box filters branches by name
- [ ] Group headers show branch counts
- [ ] Current branch auto-expanded
- [ ] Remote branches grouped by remote name

## Technical Details
- **File to create**: `frontend/src/components/branch/BranchTree.tsx`

- **Implementation**:
  ```typescript
  import { useState } from 'react';
  import { ChevronRight, ChevronDown, Search } from 'lucide-react';
  import { BranchItem } from './BranchItem';
  import type { Branch } from '@/types/git';

  interface BranchTreeProps {
    localBranches: Branch[];
    remoteBranches: Branch[];
    currentBranch: string;
  }

  export function BranchTree({ localBranches, remoteBranches, currentBranch }: BranchTreeProps) {
    const [expandedGroups, setExpandedGroups] = useState(new Set(['local']));
    const [searchQuery, setSearchQuery] = useState('');

    const filterBranches = (branches: Branch[]) => {
      if (!searchQuery) return branches;
      return branches.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };

    const filteredLocal = filterBranches(localBranches);
    const filteredRemote = filterBranches(remoteBranches);

    return (
      <div className="branch-tree">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Local Branches */}
        <div>
          <button
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 font-semibold text-sm"
            onClick={() => {
              setExpandedGroups(prev => {
                const next = new Set(prev);
                next.has('local') ? next.delete('local') : next.add('local');
                return next;
              });
            }}
          >
            {expandedGroups.has('local') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>Local Branches</span>
            <span className="text-gray-500">({filteredLocal.length})</span>
          </button>
          {expandedGroups.has('local') && filteredLocal.map(branch => (
            <BranchItem
              key={branch.name}
              branch={branch}
              isCurrent={branch.name === currentBranch}
              onCheckout={() => {}}
            />
          ))}
        </div>

        {/* Remote Branches */}
        <div>
          <button
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 font-semibold text-sm"
            onClick={() => {
              setExpandedGroups(prev => {
                const next = new Set(prev);
                next.has('remote') ? next.delete('remote') : next.add('remote');
                return next;
              });
            }}
          >
            {expandedGroups.has('remote') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>Remote Branches</span>
            <span className="text-gray-500">({filteredRemote.length})</span>
          </button>
          {expandedGroups.has('remote') && filteredRemote.map(branch => (
            <BranchItem
              key={branch.name}
              branch={branch}
              isCurrent={false}
              onCheckout={() => {}}
            />
          ))}
        </div>
      </div>
    );
  }
  ```

## Estimated Time
2.5 hours

## Dependencies
- Depends on: 2025-10-11-1330-feat-create-branch-item.md

## Notes
- Search should be debounced for performance
- Auto-expand group containing current branch
- Consider grouping remotes (origin, upstream)
