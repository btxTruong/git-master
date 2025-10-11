import { GitBranch, MoreVertical } from 'lucide-react';
import type { Branch } from '@/types/git';

interface BranchItemProps {
  branch: Branch;
  isCurrent: boolean;
  onCheckout: (name: string) => void;
  onContextMenu?: (branch: Branch, event: React.MouseEvent) => void;
}

export function BranchItem({ branch, isCurrent, onCheckout, onContextMenu }: BranchItemProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(branch, e);
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${isCurrent ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
      onClick={() => !isCurrent && onCheckout(branch.name)}
      onContextMenu={handleContextMenu}
    >
      <GitBranch className={`w-4 h-4 ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`} />
      <span
        className={`flex-1 text-sm ${isCurrent ? 'font-semibold text-blue-900' : 'font-medium text-gray-900'}`}
      >
        {branch.name}
      </span>

      {isCurrent && (
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-semibold">
          CURRENT
        </span>
      )}

      {branch.upstream && (
        <span className="text-xs text-gray-500 truncate max-w-32" title={branch.upstream}>
          {branch.upstream}
        </span>
      )}

      <div className="flex items-center gap-1">
        {branch.ahead !== undefined && branch.ahead > 0 && (
          <span className="text-xs text-green-600 font-semibold">{branch.ahead}</span>
        )}
        {branch.behind !== undefined && branch.behind > 0 && (
          <span className="text-xs text-red-600 font-semibold">{branch.behind}</span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu?.(branch, e);
        }}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
