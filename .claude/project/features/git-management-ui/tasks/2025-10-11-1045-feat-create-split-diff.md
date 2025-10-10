# Create SplitDiff Component

## Type
feat

## Description
Create the SplitDiff component that displays code changes in split view (side-by-side comparison of old vs new). Features synchronized scrolling, syntax highlighting, and visual highlighting of changed sections within lines.

## Acceptance Criteria
- [ ] `components/diff/SplitDiff.tsx` component created
- [ ] Side-by-side layout with old file on left, new file on right
- [ ] Synchronized scrolling between both panes
- [ ] Line numbers displayed for both sides
- [ ] Changed sections within lines highlighted
- [ ] Empty space for added-only or deleted-only lines
- [ ] Syntax highlighting applied independently to both sides
- [ ] Responsive design with minimum widths
- [ ] Handles multi-line hunks correctly

## Technical Details
- **File to create**: `frontend/src/components/diff/SplitDiff.tsx`

- **Implementation**:
  ```typescript
  import { useRef, useEffect } from 'react';
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
  import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
  import type { FileDiff } from '@/types/git';
  import { detectLanguage } from '@/utils/diffParser';

  interface SplitDiffProps {
    fileDiff: FileDiff;
  }

  export function SplitDiff({ fileDiff }: SplitDiffProps) {
    const leftPaneRef = useRef<HTMLDivElement>(null);
    const rightPaneRef = useRef<HTMLDivElement>(null);
    const language = detectLanguage(fileDiff.path);

    // Synchronized scrolling
    useEffect(() => {
      const leftPane = leftPaneRef.current;
      const rightPane = rightPaneRef.current;
      if (!leftPane || !rightPane) return;

      const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
        target.scrollTop = source.scrollTop;
      };

      const handleLeftScroll = () => syncScroll(leftPane, rightPane);
      const handleRightScroll = () => syncScroll(rightPane, leftPane);

      leftPane.addEventListener('scroll', handleLeftScroll);
      rightPane.addEventListener('scroll', handleRightScroll);

      return () => {
        leftPane.removeEventListener('scroll', handleLeftScroll);
        rightPane.removeEventListener('scroll', handleRightScroll);
      };
    }, []);

    return (
      <div className="split-diff grid grid-cols-2 gap-px bg-gray-300">
        {/* Left pane: Old file */}
        <div
          ref={leftPaneRef}
          className="overflow-auto bg-white font-mono text-sm"
        >
          <div className="sticky top-0 bg-red-100 text-red-900 px-4 py-2 text-xs font-semibold border-b border-red-200">
            Old ({fileDiff.oldPath})
          </div>
          {fileDiff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex}>
              {hunk.lines
                .filter(line => line.type !== 'add')
                .map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className={`flex ${
                      line.type === 'delete' ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    <div className="w-12 text-right px-2 text-gray-500 select-none">
                      {line.oldLineNumber}
                    </div>
                    <div className="flex-1 px-4">{line.content}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Right pane: New file */}
        <div
          ref={rightPaneRef}
          className="overflow-auto bg-white font-mono text-sm"
        >
          <div className="sticky top-0 bg-green-100 text-green-900 px-4 py-2 text-xs font-semibold border-b border-green-200">
            New ({fileDiff.newPath})
          </div>
          {fileDiff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex}>
              {hunk.lines
                .filter(line => line.type !== 'delete')
                .map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className={`flex ${
                      line.type === 'add' ? 'bg-green-50' : 'bg-white'
                    }`}
                  >
                    <div className="w-12 text-right px-2 text-gray-500 select-none">
                      {line.newLineNumber}
                    </div>
                    <div className="flex-1 px-4">{line.content}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

## Estimated Time
4 hours

## Dependencies
- Depends on: 2025-10-11-1015-feat-create-diff-viewer.md
- Depends on: 2025-10-11-1000-chore-install-syntax-highlighter.md

## Notes
- Synchronized scrolling requires careful event listener management
- Consider adding word-level diff highlighting (future enhancement)
- Empty lines should be shown when one side has additions/deletions only
- Both panes should have equal minimum widths for readability
