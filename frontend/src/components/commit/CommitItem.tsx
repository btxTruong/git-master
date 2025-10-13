import { memo, useMemo } from 'react';
import { type Commit } from '@/stores/commitStore';
import { User, Calendar, GitMerge } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { formatDate } from '@/utils/dateFormat';
import { CommitGraphCell } from './CommitGraphCell';
import type { CommitLaneInfo } from '@/utils/gitGraphLayout';

interface CommitItemProps {
  commit: Commit;
  isSelected: boolean;
  onClick: () => void;
  laneInfo?: CommitLaneInfo;
  showGraph?: boolean;
}

/**
 * Memoized commit item component
 * Optimized to prevent unnecessary re-renders in long commit lists
 * Responsive:
 * - Large screens: Show all information (hash, refs, message, author, timestamp)
 * - Small screens: Show only message with ellipsis, expand all info when selected without overlap
 */
export const CommitItem = memo(function CommitItem({
  commit,
  isSelected,
  onClick,
  laneInfo,
  showGraph = true,
}: CommitItemProps) {
  const dateFormat = useUIStore((state) => state.dateFormat);
  const theme = useUIStore((state) => state.theme);

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

  const formattedDate = useMemo(() => {
    return formatDate(commit.date, dateFormat);
  }, [commit.date, dateFormat]);

  const isMergeCommit = commit.parentHashes && commit.parentHashes.length >= 2;
  const isOctopusMerge = commit.parentHashes && commit.parentHashes.length >= 3;

  return (
    <div
      onClick={onClick}
      className={`
        group relative px-4 py-2.5 cursor-pointer transition-colors duration-200
        border-b border-gray-200 dark:border-gray-700
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {showGraph && laneInfo ? (
          <div className="flex-shrink-0 self-stretch flex items-center pr-2">
            <CommitGraphCell laneInfo={laneInfo} isDark={isDark} />
          </div>
        ) : (
          <div className="flex-shrink-0 mt-1">
            <div
              className={`
              w-2 h-2 rounded-full transition-colors
              ${isSelected ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600 group-hover:bg-blue-400'}
            `}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Hash and refs - always render but control visibility with max-lg:hidden */}
          <div className={`flex items-center gap-2 flex-wrap ${isSelected ? '' : 'max-lg:hidden'}`}>
            <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400 shrink-0">
              {commit.shortHash}
            </span>
            {isMergeCommit && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded
                           bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300
                           border border-purple-200 dark:border-purple-700"
                title={
                  isOctopusMerge
                    ? `Octopus merge (${commit.parentHashes.length} parents)`
                    : 'Merge commit'
                }
              >
                <GitMerge className="w-3 h-3" />
                {isOctopusMerge && (
                  <span className="font-semibold">{commit.parentHashes.length}</span>
                )}
              </span>
            )}
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

          {/* Commit message - truncate unless selected or large screen */}
          <div
            className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
              isSelected
                ? 'whitespace-normal break-words'
                : 'truncate lg:whitespace-normal lg:break-words'
            }`}
          >
            {commit.shortMessage || commit.message}
          </div>

          {/* Author and timestamp */}
          <div
            className={`flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap ${isSelected ? '' : 'max-lg:hidden'}`}
          >
            <div className="flex items-center gap-1.5 font-medium min-w-0">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{commit.author.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
