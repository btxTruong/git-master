# Create FileDiffHeader Component

## Type
feat

## Description
Create the FileDiffHeader component that displays file path, change statistics (+X -Y lines), file status (modified/added/deleted/renamed), and collapse/expand controls for each file in a diff view.

## Acceptance Criteria
- [ ] `components/diff/FileDiffHeader.tsx` component created
- [ ] Displays file path prominently
- [ ] Shows +X -Y line change statistics with color coding
- [ ] Displays file status badge (M/A/D/R)
- [ ] Collapse/expand button toggles file diff visibility
- [ ] Handles renamed files (shows old → new path)
- [ ] Icon changes based on file status
- [ ] Hover state provides visual feedback
- [ ] Uses Tailwind for styling

## Technical Details
- **File to create**: `frontend/src/components/diff/FileDiffHeader.tsx`

- **Implementation**:
  ```typescript
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
    }[fileDiff.status];

    const statusBadge = {
      added: 'A',
      deleted: 'D',
      modified: 'M',
      renamed: 'R',
    }[fileDiff.status];

    const statusBadgeColor = {
      added: 'bg-green-100 text-green-800',
      deleted: 'bg-red-100 text-red-800',
      modified: 'bg-blue-100 text-blue-800',
      renamed: 'bg-purple-100 text-purple-800',
    }[fileDiff.status];

    return (
      <div
        className="file-diff-header flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-150 cursor-pointer border-b border-gray-200"
        onClick={onToggle}
      >
        {/* Collapse/Expand icon */}
        <button className="flex-shrink-0 text-gray-600">
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
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
              <span>{fileDiff.newPath}</span>
            </>
          ) : (
            <span>{fileDiff.path}</span>
          )}
        </div>

        {/* Statistics */}
        <div className="flex-shrink-0 flex items-center gap-3 text-sm font-mono">
          <span className="text-green-600 font-semibold">
            +{fileDiff.additions}
          </span>
          <span className="text-red-600 font-semibold">
            -{fileDiff.deletions}
          </span>
        </div>
      </div>
    );
  }
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-1015-feat-create-diff-viewer.md

## Notes
- FileDiff type should include: path, oldPath, newPath, status, additions, deletions
- Click anywhere on header should toggle collapse/expand
- Consider adding file icon based on extension (future enhancement)
- Statistics should be hidden for binary files
