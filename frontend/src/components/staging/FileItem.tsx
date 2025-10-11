import { memo, useMemo } from 'react';
import { File, FilePlus, FileMinus, FileEdit } from 'lucide-react';
import type { StagingFileChange } from '@/types/git';
import { FileStatus } from '@/types/git';

interface FileItemProps {
  file: StagingFileChange;
  selected: boolean;
  onSelect: (file: StagingFileChange) => void;
}

// Status configuration moved outside component to avoid recreation
const STATUS_CONFIG = {
  [FileStatus.Modified]: {
    icon: <FileEdit className="w-4 h-4 text-blue-600" />,
    badge: 'M',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  [FileStatus.Added]: {
    icon: <FilePlus className="w-4 h-4 text-green-600" />,
    badge: 'A',
    badgeClass: 'bg-green-100 text-green-800',
  },
  [FileStatus.Deleted]: {
    icon: <FileMinus className="w-4 h-4 text-red-600" />,
    badge: 'D',
    badgeClass: 'bg-red-100 text-red-800',
  },
  [FileStatus.Renamed]: {
    icon: <File className="w-4 h-4 text-purple-600" />,
    badge: 'R',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  [FileStatus.Copied]: {
    icon: <File className="w-4 h-4 text-purple-600" />,
    badge: 'C',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  [FileStatus.Untracked]: {
    icon: <File className="w-4 h-4 text-gray-600" />,
    badge: 'U',
    badgeClass: 'bg-gray-100 text-gray-800',
  },
};

/**
 * Memoized file item component
 * Optimized to prevent unnecessary re-renders in file lists
 */
export const FileItem = memo(function FileItem({ file, selected, onSelect }: FileItemProps) {
  const config = useMemo(() => STATUS_CONFIG[file.status], [file.status]);

  return (
    <div
      className={`file-item flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelect(file)}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">{config.icon}</div>

      {/* File name */}
      <span className="flex-1 text-sm font-mono truncate" title={file.path}>
        {file.path}
      </span>

      {/* Status badge */}
      <span
        className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded ${config.badgeClass}`}
      >
        {config.badge}
      </span>
    </div>
  );
});
