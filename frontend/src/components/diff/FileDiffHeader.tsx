import { ChevronRight, ChevronDown, FileIcon, FilePlus, FileMinus, FileEdit } from 'lucide-react';
import type { FileDiff } from '@/types/git';

interface FileDiffHeaderProps {
  fileDiff: FileDiff;
  collapsed: boolean;
  onToggle: () => void;
}

export function FileDiffHeader({ fileDiff, collapsed, onToggle }: FileDiffHeaderProps) {
  const statusIcon = {
    added: <FilePlus className="w-4 h-4 text-green-600" />,
    deleted: <FileMinus className="w-4 h-4 text-red-600" />,
    modified: <FileEdit className="w-4 h-4 text-blue-600" />,
    renamed: <FileIcon className="w-4 h-4 text-purple-600" />,
    copied: <FileIcon className="w-4 h-4 text-purple-600" />,
  }[fileDiff.status];

  const statusBadge = {
    added: 'A',
    deleted: 'D',
    modified: 'M',
    renamed: 'R',
    copied: 'C',
  }[fileDiff.status];

  const statusBadgeColor = {
    added: 'bg-green-100 text-green-800',
    deleted: 'bg-red-100 text-red-800',
    modified: 'bg-blue-100 text-blue-800',
    renamed: 'bg-purple-100 text-purple-800',
    copied: 'bg-purple-100 text-purple-800',
  }[fileDiff.status];

  return (
    <div
      className="file-diff-header flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 cursor-pointer border-b border-gray-300 transition-colors"
      onClick={onToggle}
    >
      {/* Collapse/Expand icon */}
      <button
        className="flex-shrink-0 text-gray-600 hover:text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Status icon */}
      <div className="flex-shrink-0">{statusIcon}</div>

      {/* Status badge */}
      <span
        className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded ${statusBadgeColor}`}
      >
        {statusBadge}
      </span>

      {/* File path */}
      <div className="flex-1 font-mono text-sm font-medium text-gray-900 truncate">
        {fileDiff.status === 'renamed' ? (
          <>
            <span className="text-gray-500">{fileDiff.oldPath}</span>
            <span className="mx-2 text-gray-400">→</span>
            <span>{fileDiff.path}</span>
          </>
        ) : (
          <span>{fileDiff.path}</span>
        )}
      </div>

      {/* Statistics */}
      {!fileDiff.isBinary && (
        <div className="flex-shrink-0 flex items-center gap-3 text-sm font-mono">
          <span className="text-green-600 font-semibold">+{fileDiff.additions}</span>
          <span className="text-red-600 font-semibold">-{fileDiff.deletions}</span>
        </div>
      )}
      {fileDiff.isBinary && (
        <div className="flex-shrink-0 text-xs text-gray-500 italic">Binary file</div>
      )}
    </div>
  );
}
