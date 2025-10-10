# Create UnifiedDiff Component

## Type
feat

## Description
Create the UnifiedDiff component that displays code changes in unified format (traditional +/- line-by-line diff). Includes syntax highlighting, line numbers, and visual indicators for additions, deletions, and unchanged lines.

## Acceptance Criteria
- [x] `components/diff/UnifiedDiff.tsx` component created
- [x] Line-by-line rendering with proper formatting
- [x] Green background for added lines (with + prefix)
- [x] Red background for removed lines (with - prefix)
- [x] Gray background for unchanged context lines
- [x] Line numbers displayed on left side
- [x] Syntax highlighting applied based on file extension
- [x] Handles multi-line hunks correctly
- [x] Responsive layout with horizontal scroll for long lines

## Technical Details
- **File to create**: `frontend/src/components/diff/UnifiedDiff.tsx`

- **Implementation**:
  ```typescript
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
  import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
  import type { FileDiff } from '@/types/git';
  import { detectLanguage } from '@/utils/diffParser';

  interface UnifiedDiffProps {
    fileDiff: FileDiff;
  }

  export function UnifiedDiff({ fileDiff }: UnifiedDiffProps) {
    const language = detectLanguage(fileDiff.path);

    return (
      <div className="unified-diff font-mono text-sm">
        {fileDiff.hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex} className="hunk">
            {/* Hunk header */}
            <div className="bg-blue-50 text-blue-900 px-4 py-1 text-xs font-semibold">
              {hunk.header}
            </div>

            {/* Lines */}
            <div className="lines">
              {hunk.lines.map((line, lineIndex) => {
                const lineType = line.type; // 'add' | 'delete' | 'context'
                const bgColor =
                  lineType === 'add'
                    ? 'bg-green-50'
                    : lineType === 'delete'
                    ? 'bg-red-50'
                    : 'bg-white';
                const textColor =
                  lineType === 'add'
                    ? 'text-green-900'
                    : lineType === 'delete'
                    ? 'text-red-900'
                    : 'text-gray-800';
                const prefix =
                  lineType === 'add' ? '+' : lineType === 'delete' ? '-' : ' ';

                return (
                  <div
                    key={lineIndex}
                    className={`flex ${bgColor} ${textColor} hover:bg-opacity-80`}
                  >
                    {/* Line numbers */}
                    <div className="w-20 flex-shrink-0 px-2 text-right text-gray-500 select-none">
                      <span className="inline-block w-8">
                        {line.oldLineNumber || ''}
                      </span>
                      <span className="inline-block w-8">
                        {line.newLineNumber || ''}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-4 overflow-x-auto">
                      <span className="inline-block w-4 text-gray-400">
                        {prefix}
                      </span>
                      <span>{line.content}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

## Estimated Time
3 hours

## Dependencies
- Depends on: 2025-10-11-1015-feat-create-diff-viewer.md
- Depends on: 2025-10-11-1000-chore-install-syntax-highlighter.md

## Notes
- FileDiff.hunks should contain parsed hunk data from backend
- Line numbers should account for added/deleted lines
- Consider using react-window for virtualizing very long diffs
- detectLanguage utility maps file extensions to Prism language identifiers
