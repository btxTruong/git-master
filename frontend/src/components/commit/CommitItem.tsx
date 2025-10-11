import { memo, useMemo } from 'react';
import { type Commit } from '@/stores/commitStore';
import { User, Calendar } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { formatDate } from '@/utils/dateFormat';

interface CommitItemProps {
  commit: Commit;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Memoized commit item component
 * Optimized to prevent unnecessary re-renders in long commit lists
 */
export const CommitItem = memo(function CommitItem({
  commit,
  isSelected,
  onClick,
}: CommitItemProps) {
  const dateFormat = useUIStore((state) => state.dateFormat);

  const formattedDate = useMemo(() => {
    return formatDate(commit.date, dateFormat);
  }, [commit.date, dateFormat]);

  return (
    <div
      onClick={onClick}
      className={`
        group relative h-[72px] px-4 py-2 cursor-pointer transition-all duration-200
        border-b border-gray-200 dark:border-gray-700 overflow-hidden
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div
            className={`
            w-2 h-2 rounded-full transition-colors
            ${isSelected ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600 group-hover:bg-blue-400'}
          `}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1 h-full flex flex-col">
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
              {commit.shortHash}
            </span>
            {commit.refs && commit.refs.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {commit.refs.map((ref, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
                             bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300
                             border border-blue-200 dark:border-blue-700"
                  >
                    {ref.replace(/^HEAD -> /, '')}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-3 break-words">
            {commit.shortMessage || commit.message}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-auto shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{commit.author.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            {(commit.insertions > 0 || commit.deletions > 0) && (
              <div className="flex items-center gap-2 ml-auto">
                {commit.insertions > 0 && (
                  <span className="font-mono text-green-600 dark:text-green-400">
                    +{commit.insertions}
                  </span>
                )}
                {commit.deletions > 0 && (
                  <span className="font-mono text-red-600 dark:text-red-400">
                    -{commit.deletions}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
