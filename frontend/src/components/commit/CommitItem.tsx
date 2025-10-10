import { type Commit } from '@/stores/commitStore';
import { GitCommit, User, Calendar } from 'lucide-react';

interface CommitItemProps {
  commit: Commit;
  isSelected: boolean;
  onClick: () => void;
}

export function CommitItem({ commit, isSelected, onClick }: CommitItemProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-900/30 border-2 border-blue-600' : 'bg-gray-800 hover:bg-gray-750'
      }`}
    >
      <div className="flex items-start gap-3">
        <GitCommit className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-500">{commit.shortHash}</span>
            {commit.refs && commit.refs.length > 0 && (
              <div className="flex gap-1">
                {commit.refs.map((ref, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs rounded bg-blue-900/50 text-blue-300 border border-blue-700"
                  >
                    {ref.replace(/^HEAD -> /, '')}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-200 mb-2">{commit.shortMessage || commit.message}</div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{commit.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(commit.date)}</span>
            </div>
            {(commit.insertions > 0 || commit.deletions > 0) && (
              <div className="flex items-center gap-2">
                {commit.insertions > 0 && (
                  <span className="text-green-400">+{commit.insertions}</span>
                )}
                {commit.deletions > 0 && <span className="text-red-400">-{commit.deletions}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
