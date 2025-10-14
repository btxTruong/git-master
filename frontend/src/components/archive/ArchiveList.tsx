import { memo, useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Archive, ArrowUpDown, Loader2 } from 'lucide-react';
import { ArchiveItem, type ArchiveAction } from './ArchiveItem';
import type { ArchiveListEntry } from '@/types/changelist';

interface ArchiveListProps {
  archives: ArchiveListEntry[];
  selectedArchiveId: string | null;
  onSelectArchive: (archiveId: string) => void;
  onArchiveAction?: (action: ArchiveAction, archiveId: string) => void;
  isLoading?: boolean;
}

type SortField = 'date' | 'name' | 'fileCount';
type SortOrder = 'asc' | 'desc';

interface SortButtonProps {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onClick: (field: SortField) => void;
}

/**
 * Sort button for the archive list
 */
function SortButton({ label, field, currentField, currentOrder, onClick }: SortButtonProps) {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onClick(field)}
      className={`
        px-3 py-1.5 text-xs font-medium rounded transition-colors
        ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
      `}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && (
          <ArrowUpDown
            className={`w-3 h-3 transition-transform ${currentOrder === 'desc' ? 'rotate-180' : ''}`}
          />
        )}
      </span>
    </button>
  );
}

/**
 * Sort archives based on field and order
 */
function sortArchives(
  archives: ArchiveListEntry[],
  field: SortField,
  order: SortOrder
): ArchiveListEntry[] {
  const sorted = [...archives].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'date':
        comparison = new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime();
        break;
      case 'name':
        comparison = a.archiveName.localeCompare(b.archiveName);
        break;
      case 'fileCount':
        comparison = a.totalFilesCount - b.totalFilesCount;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * ArchiveList component displays all archives with sorting and virtualization
 */
export const ArchiveList = memo(function ArchiveList({
  archives,
  selectedArchiveId,
  onSelectArchive,
  onArchiveAction,
  isLoading = false,
}: ArchiveListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Newest first by default

  const parentRef = useRef<HTMLDivElement>(null);

  // Sort archives
  const sortedArchives = useMemo(
    () => sortArchives(archives, sortField, sortOrder),
    [archives, sortField, sortOrder]
  );

  // Use virtualization for lists with more than 50 items
  const shouldVirtualize = sortedArchives.length > 50;

  const virtualizer = useVirtualizer({
    count: sortedArchives.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each ArchiveItem
    enabled: shouldVirtualize,
    overscan: 5,
  });

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default order
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading archives...</p>
      </div>
    );
  }

  // Empty state
  if (archives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Archive className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No archives yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          Archives are snapshots of your changelists that you can restore later. Create an archive
          by right-clicking a changelist group.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">Sort by:</span>
        <SortButton
          label="Date"
          field="date"
          currentField={sortField}
          currentOrder={sortOrder}
          onClick={handleSortClick}
        />
        <SortButton
          label="Name"
          field="name"
          currentField={sortField}
          currentOrder={sortOrder}
          onClick={handleSortClick}
        />
        <SortButton
          label="Files"
          field="fileCount"
          currentField={sortField}
          currentOrder={sortOrder}
          onClick={handleSortClick}
        />
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-500">
          {archives.length} {archives.length === 1 ? 'archive' : 'archives'}
        </div>
      </div>

      {/* Archive List */}
      <div ref={parentRef} className="flex-1 overflow-auto px-4 py-3">
        {shouldVirtualize ? (
          // Virtualized list for large datasets
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const archive = sortedArchives[virtualItem.index];
              return (
                <div
                  key={archive.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-2"
                >
                  <ArchiveItem
                    archive={archive}
                    isSelected={archive.id === selectedArchiveId}
                    onSelect={onSelectArchive}
                    onAction={onArchiveAction}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // Regular list for smaller datasets
          <div className="space-y-2">
            {sortedArchives.map((archive) => (
              <ArchiveItem
                key={archive.id}
                archive={archive}
                isSelected={archive.id === selectedArchiveId}
                onSelect={onSelectArchive}
                onAction={onArchiveAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
