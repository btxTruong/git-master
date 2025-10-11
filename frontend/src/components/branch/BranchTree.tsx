import { useState } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { BranchItem } from './BranchItem';
import type { Branch } from '@/types/git';

interface BranchTreeProps {
  localBranches: Branch[];
  remoteBranches: Branch[];
  currentBranch: string;
  onCheckout: (name: string) => void;
}

export function BranchTree({
  localBranches,
  remoteBranches,
  currentBranch,
  onCheckout,
}: BranchTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState(new Set(['local']));
  const [searchQuery, setSearchQuery] = useState('');

  const filterBranches = (branches: Branch[]) => {
    if (!searchQuery) return branches;
    return branches.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const filteredLocal = filterBranches(localBranches);
  const filteredRemote = filterBranches(remoteBranches);

  return (
    <div className="branch-tree h-full flex flex-col">
      {/* Search box */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Branch groups */}
      <div className="flex-1 overflow-auto">
        {/* Local Branches */}
        <div className="border-b border-gray-200">
          <button
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 font-semibold text-sm text-gray-700 transition-colors"
            onClick={() => toggleGroup('local')}
          >
            {expandedGroups.has('local') ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
            <span>Local Branches</span>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredLocal.length}
            </span>
          </button>

          {expandedGroups.has('local') && (
            <div className="bg-white">
              {filteredLocal.length > 0 ? (
                filteredLocal.map((branch) => (
                  <BranchItem
                    key={branch.name}
                    branch={branch}
                    isCurrent={branch.name === currentBranch}
                    onCheckout={onCheckout}
                  />
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No local branches found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remote Branches */}
        <div>
          <button
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 font-semibold text-sm text-gray-700 transition-colors"
            onClick={() => toggleGroup('remote')}
          >
            {expandedGroups.has('remote') ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
            <span>Remote Branches</span>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredRemote.length}
            </span>
          </button>

          {expandedGroups.has('remote') && (
            <div className="bg-white">
              {filteredRemote.length > 0 ? (
                filteredRemote.map((branch) => (
                  <BranchItem
                    key={branch.name}
                    branch={branch}
                    isCurrent={false}
                    onCheckout={onCheckout}
                  />
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No remote branches found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
