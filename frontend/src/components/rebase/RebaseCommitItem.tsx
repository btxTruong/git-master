import { useRebaseStore } from '@/stores/rebaseStore';
import type { RebaseCommit } from '@/types/git';
import { RebaseAction } from '@/types/git';
import { ChevronDown } from 'lucide-react';

interface RebaseCommitItemProps {
  commit: RebaseCommit;
}

export function RebaseCommitItem({ commit }: RebaseCommitItemProps) {
  const { updateCommitAction } = useRebaseStore();

  const actionColors = {
    [RebaseAction.Pick]: 'text-green-400 bg-green-900/30',
    [RebaseAction.Reword]: 'text-blue-400 bg-blue-900/30',
    [RebaseAction.Edit]: 'text-yellow-400 bg-yellow-900/30',
    [RebaseAction.Squash]: 'text-purple-400 bg-purple-900/30',
    [RebaseAction.Fixup]: 'text-pink-400 bg-pink-900/30',
    [RebaseAction.Drop]: 'text-red-400 bg-red-900/30',
  };

  const actions = Object.values(RebaseAction);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
      {/* Action Selector */}
      <div className="relative flex-shrink-0">
        <select
          value={commit.action}
          onChange={(e) => updateCommitAction(commit.hash, e.target.value as RebaseAction)}
          className={`appearance-none px-3 py-1.5 pr-8 rounded text-sm font-medium border border-transparent focus:outline-none focus:border-blue-500 transition-colors cursor-pointer ${actionColors[commit.action]}`}
        >
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
      </div>

      {/* Commit Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-500">{commit.shortHash}</span>
        </div>
        <p className="text-sm text-gray-200 truncate">{commit.message}</p>
      </div>
    </div>
  );
}
