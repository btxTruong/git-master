# Create FileItem Component

## Type
feat

## Description
Create the FileItem component that represents a single file in the file tree or staging area. Displays file name, status badge, and provides visual feedback on hover and selection.

## Acceptance Criteria
- [x] `components/staging/FileItem.tsx` component created
- [x] Shows file name with appropriate icon
- [x] Status badge displays (M/A/D/R) with color coding
- [x] Click handler for file selection
- [x] Hover effect provides visual feedback
- [x] Selected state clearly visible
- [x] Truncates long file names with ellipsis
- [x] Supports keyboard navigation (future enhancement)

## Technical Details
- **File to create**: `frontend/src/components/staging/FileItem.tsx`

- **Implementation**:
  ```typescript
  import { File, FilePlus, FileMinus, FileEdit } from 'lucide-react';
  import type { FileChange } from '@/types/git';

  interface FileItemProps {
    file: FileChange;
    selected: boolean;
    onSelect: (file: FileChange) => void;
  }

  export function FileItem({ file, selected, onSelect }: FileItemProps) {
    const statusConfig = {
      modified: {
        icon: <FileEdit className="w-4 h-4 text-blue-600" />,
        badge: 'M',
        badgeClass: 'bg-blue-100 text-blue-800',
      },
      added: {
        icon: <FilePlus className="w-4 h-4 text-green-600" />,
        badge: 'A',
        badgeClass: 'bg-green-100 text-green-800',
      },
      deleted: {
        icon: <FileMinus className="w-4 h-4 text-red-600" />,
        badge: 'D',
        badgeClass: 'bg-red-100 text-red-800',
      },
      renamed: {
        icon: <File className="w-4 h-4 text-purple-600" />,
        badge: 'R',
        badgeClass: 'bg-purple-100 text-purple-800',
      },
    };

    const config = statusConfig[file.status];

    return (
      <div
        className={`file-item flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
          selected
            ? 'bg-blue-50 border-l-4 border-blue-500'
            : 'hover:bg-gray-50'
        }`}
        onClick={() => onSelect(file)}
      >
        {/* Status icon */}
        <div className="flex-shrink-0">{config.icon}</div>

        {/* File name */}
        <span
          className="flex-1 text-sm font-mono truncate"
          title={file.path}
        >
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
  }
  ```

## Estimated Time
1.5 hours

## Dependencies
- Depends on: 2025-10-11-1130-feat-create-file-tree.md

## Notes
- FileChange type should include: path, status, staged property
- Selected state should be visually distinct with border and background
- Consider adding checkbox for multi-select (future enhancement)
- Status icons should match those used in FileDiffHeader for consistency
