# Create StagingArea Component

## Type
feat

## Description
Create the main StagingArea component that displays changed files organized into three sections: Staged, Unstaged, and Untracked. Includes actions for staging/unstaging files and committing changes.

## Acceptance Criteria
- [ ] `components/staging/StagingArea.tsx` component created
- [ ] Three collapsible sections: Staged, Unstaged, Untracked
- [ ] Each section shows file count
- [ ] Stage all / Unstage all buttons
- [ ] Individual file stage/unstage actions
- [ ] Commit button (enabled when staged files exist)
- [ ] File selection shows diff preview
- [ ] Loading states for operations
- [ ] Uses FileTree for each section

## Technical Details
- **File to create**: `frontend/src/components/staging/StagingArea.tsx`

- **Implementation**:
  ```typescript
  import { useState } from 'react';
  import { useStagingStore } from '@/stores/stagingStore';
  import { FileTree } from './FileTree';
  import { StagingDiff } from './StagingDiff';
  import { CommitDialog } from './CommitDialog';
  import { Button } from '@/components/common/Button';

  export function StagingArea() {
    const { stagedFiles, unstagedFiles, untrackedFiles, selectedFile, stageAll, unstageAll } = useStagingStore();
    const [showCommitDialog, setShowCommitDialog] = useState(false);

    return (
      <div className="staging-area h-full grid grid-cols-2 gap-4">
        {/* Left: File lists */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Staged */}
          <section className="border rounded">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
              <h3 className="font-semibold">Staged ({stagedFiles.length})</h3>
              {stagedFiles.length > 0 && (
                <button onClick={unstageAll} className="text-sm text-blue-600 hover:underline">
                  Unstage All
                </button>
              )}
            </div>
            <FileTree files={stagedFiles} selectedFile={selectedFile} onFileSelect={() => {}} />
          </section>

          {/* Unstaged */}
          <section className="border rounded">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
              <h3 className="font-semibold">Unstaged ({unstagedFiles.length})</h3>
              {unstagedFiles.length > 0 && (
                <button onClick={stageAll} className="text-sm text-blue-600 hover:underline">
                  Stage All
                </button>
              )}
            </div>
            <FileTree files={unstagedFiles} selectedFile={selectedFile} onFileSelect={() => {}} />
          </section>

          {/* Untracked */}
          {untrackedFiles.length > 0 && (
            <section className="border rounded">
              <div className="px-4 py-2 bg-gray-100 border-b">
                <h3 className="font-semibold">Untracked ({untrackedFiles.length})</h3>
              </div>
              <FileTree files={untrackedFiles} selectedFile={selectedFile} onFileSelect={() => {}} />
            </section>
          )}

          {/* Commit button */}
          <Button
            variant="primary"
            disabled={stagedFiles.length === 0}
            onClick={() => setShowCommitDialog(true)}
            className="w-full"
          >
            Commit ({stagedFiles.length})
          </Button>
        </div>

        {/* Right: Diff preview */}
        <div className="border rounded overflow-hidden">
          <StagingDiff file={selectedFile} />
        </div>

        {/* Commit dialog */}
        {showCommitDialog && (
          <CommitDialog onClose={() => setShowCommitDialog(false)} />
        )}
      </div>
    );
  }
  ```

## Estimated Time
3 hours

## Dependencies
- Depends on: 2025-10-11-1445-feat-create-staging-store.md
- Depends on: 2025-10-11-1130-feat-create-file-tree.md

## Notes
- Each section should be independently scrollable
- Consider drag-and-drop between sections (future enhancement)
- Keyboard shortcuts: Space to stage/unstage, Enter to commit
