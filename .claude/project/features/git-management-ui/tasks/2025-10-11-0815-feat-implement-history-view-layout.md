# Implement History View Layout

## Type
feat

## Description
Implement the HistoryView component with a two-column layout: commit list on the left and commit detail panel on the right. Include search/filter controls above the commit list and handle empty states (no repository, no commits).

## Acceptance Criteria
- [ ] `views/HistoryView.tsx` fully implemented
- [ ] Two-column layout: commit list (left 40%), commit detail (right 60%)
- [ ] Search bar and filter controls above commit list
- [ ] Empty state shown when no repository is open
- [ ] Empty state shown when repository has no commits
- [ ] Resizable split pane (future enhancement noted, not required now)
- [ ] Layout is responsive and handles window resizing
- [ ] Loading state displayed while commits are being fetched

## Technical Details
- **File to modify**: `frontend/src/views/HistoryView.tsx`

- **Implementation**:
  ```typescript
  import { useEffect } from 'react';
  import { FolderOpen, FileText } from 'lucide-react';
  import { useRepositoryStore } from '@/stores/repositoryStore';
  import { useCommitStore } from '@/stores/commitStore';
  import { EmptyState } from '@/components/common/EmptyState';
  import { Spinner } from '@/components/common/Spinner';

  export function HistoryView() {
    const { currentRepo } = useRepositoryStore();
    const { commits, isLoading, loadCommits } = useCommitStore();

    useEffect(() => {
      if (currentRepo) {
        loadCommits(0);
      }
    }, [currentRepo, loadCommits]);

    // No repository open
    if (!currentRepo) {
      return (
        <EmptyState
          icon={<FolderOpen className="w-16 h-16" />}
          title="No repository open"
          description="Open a Git repository to view commit history"
        />
      );
    }

    // Loading initial commits
    if (isLoading && commits.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Spinner size="lg" text="Loading commits..." />
        </div>
      );
    }

    // No commits in repository
    if (!isLoading && commits.length === 0) {
      return (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title="No commits yet"
          description="This repository doesn't have any commits"
        />
      );
    }

    return (
      <div className="flex h-full">
        {/* Left: Commit list */}
        <div className="w-2/5 border-r border-gray-200 flex flex-col">
          {/* Search/Filter bar - placeholder */}
          <div className="h-12 border-b border-gray-200 px-4 flex items-center">
            <input
              type="text"
              placeholder="Search commits..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Commit list container - will be implemented next */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 text-gray-600">
              Commit list will be implemented next
            </div>
          </div>
        </div>

        {/* Right: Commit detail */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <EmptyState
              title="No commit selected"
              description="Select a commit from the list to view details"
            />
          </div>
        </div>
      </div>
    );
  }
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0730-feat-create-empty-state-component.md
- Depends on: 2025-10-11-0745-feat-create-spinner-component.md
- Depends on: 2025-10-11-0615-feat-create-commit-store.md

## Notes
- Use `useEffect` to load commits when repository changes
- Left panel: 40% width (`w-2/5`), Right panel: 60% (`flex-1`)
- Handle three states: no repo, loading, no commits
- Search input is placeholder for now; will be connected to store later
- Commit list and detail components will be created in subsequent tasks
