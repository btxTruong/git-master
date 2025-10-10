# Create DiffViewer Component

## Type
feat

## Description
Create the main DiffViewer component that displays code changes with syntax highlighting. Supports toggling between unified and split diff views, collapsible sections for unchanged code, and multiple file diffs.

## Acceptance Criteria
- [x] `components/diff/DiffViewer.tsx` component created
- [x] Toggle between unified and split view modes
- [x] Displays multiple file diffs in sequence
- [x] Each file has collapsible header with stats
- [x] Syntax highlighting integrated
- [x] Handles binary files gracefully
- [x] Loading state displayed while fetching diffs
- [x] Empty state for "No changes" scenario
- [x] Uses Tailwind for styling

## Technical Details
- **File to create**: `frontend/src/components/diff/DiffViewer.tsx`

- **Implementation**:
  ```typescript
  import { useState } from 'react';
  import { useUIStore } from '@/stores/uiStore';
  import { UnifiedDiff } from './UnifiedDiff';
  import { SplitDiff } from './SplitDiff';
  import { FileDiffHeader } from './FileDiffHeader';
  import type { DiffResult, FileDiff } from '@/types/git';

  interface DiffViewerProps {
    diff: DiffResult | null;
    isLoading?: boolean;
  }

  export function DiffViewer({ diff, isLoading }: DiffViewerProps) {
    const { diffViewMode } = useUIStore();
    const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

    const toggleFile = (path: string) => {
      setCollapsedFiles(prev => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    };

    if (isLoading) {
      return <div className="p-4 text-center text-gray-500">Loading diff...</div>;
    }

    if (!diff || diff.files.length === 0) {
      return <div className="p-4 text-center text-gray-500">No changes</div>;
    }

    return (
      <div className="diff-viewer h-full overflow-auto">
        {diff.files.map((fileDiff) => (
          <div key={fileDiff.path} className="border-b border-gray-200">
            <FileDiffHeader
              fileDiff={fileDiff}
              collapsed={collapsedFiles.has(fileDiff.path)}
              onToggle={() => toggleFile(fileDiff.path)}
            />

            {!collapsedFiles.has(fileDiff.path) && (
              <div className="bg-gray-50">
                {fileDiff.isBinary ? (
                  <div className="p-4 text-sm text-gray-500">
                    Binary file not shown
                  </div>
                ) : diffViewMode === 'unified' ? (
                  <UnifiedDiff fileDiff={fileDiff} />
                ) : (
                  <SplitDiff fileDiff={fileDiff} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  ```

## Estimated Time
3 hours

## Dependencies
- Depends on: 2025-10-11-1000-chore-install-syntax-highlighter.md
- Depends on: 2025-10-11-0630-feat-create-ui-store.md

## Notes
- DiffResult type should be defined in types/git.ts
- Collapsible state per file for better UX with large diffs
- Binary files should be detected and shown as "Binary file not shown"
- Consider virtualizing for very large diffs (future optimization)
