import { memo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Archive, MoreVertical, Clock, FileText, HardDrive } from 'lucide-react';
import type { ArchiveListEntry } from '@/types/changelist';

interface ArchiveItemProps {
  archive: ArchiveListEntry;
  isSelected: boolean;
  onSelect: (archiveId: string) => void;
  onAction?: (action: ArchiveAction, archiveId: string) => void;
}

export type ArchiveAction = 'restore' | 'diff' | 'rename' | 'delete' | 'export';

interface ArchiveActionMenuProps {
  archive: ArchiveListEntry;
  onAction: (action: ArchiveAction) => void;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Context menu for archive actions
 */
function ArchiveActionMenu({ onAction, isOpen, onToggle }: ArchiveActionMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Archive actions"
        aria-label="Archive actions menu"
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={onToggle} />

          {/* Menu dropdown */}
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('restore');
                  onToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Restore Archive
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('diff');
                  onToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                View Diff
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('rename');
                  onToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('export');
                  onToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('delete');
                  onToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete Archive
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Get icon and color based on archive age
 */
function getArchiveMetrics(archivedAt: string, diffFileSize: number) {
  const archivedDate = new Date(archivedAt);
  const now = new Date();
  const daysSinceArchive = Math.floor(
    (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine icon color based on age
  let iconColor = 'text-blue-500 dark:text-blue-400'; // Recent (< 7 days)
  if (daysSinceArchive > 30) {
    iconColor = 'text-gray-500 dark:text-gray-400'; // Old (> 30 days)
  } else if (daysSinceArchive > 7) {
    iconColor = 'text-yellow-500 dark:text-yellow-400'; // Medium (7-30 days)
  }

  // Format file size
  const sizeInKB = diffFileSize / 1024;
  const sizeInMB = sizeInKB / 1024;
  const formattedSize = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${sizeInKB.toFixed(1)} KB`;

  return { iconColor, formattedSize, daysSinceArchive };
}

/**
 * Format relative date with fallback
 */
function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

/**
 * ArchiveItem component displays a single archive in the archives list
 * with metadata and context menu for actions
 */
export const ArchiveItem = memo(function ArchiveItem({
  archive,
  isSelected,
  onSelect,
  onAction,
}: ArchiveItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { iconColor, formattedSize } = getArchiveMetrics(archive.archivedAt, archive.diffFileSize);
  const relativeDate = formatRelativeDate(archive.archivedAt);

  const handleAction = (action: ArchiveAction) => {
    if (onAction) {
      onAction(action, archive.id);
    }
  };

  const handleClick = () => {
    onSelect(archive.id);
  };

  return (
    <div
      className={`
        archive-item
        border rounded-lg p-4 cursor-pointer transition-all
        ${
          isSelected
            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-selected={isSelected}
    >
      <div className="flex items-start gap-3">
        {/* Archive Icon */}
        <Archive className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Archive Name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {archive.archiveName}
            </h3>
          </div>

          {/* Original Group Name */}
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
            From: {archive.originalGroupName}
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
            {/* Date */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span title={new Date(archive.archivedAt).toLocaleString()}>{relativeDate}</span>
            </div>

            {/* File Count */}
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>
                {archive.totalFilesCount} {archive.totalFilesCount === 1 ? 'file' : 'files'}
              </span>
            </div>

            {/* Size */}
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>{formattedSize}</span>
            </div>
          </div>

          {/* Tags (if any) */}
          {archive.tags && archive.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {archive.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Menu */}
        {onAction && (
          <div onClick={(e) => e.stopPropagation()}>
            <ArchiveActionMenu
              archive={archive}
              onAction={handleAction}
              isOpen={isMenuOpen}
              onToggle={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>
        )}
      </div>
    </div>
  );
});
