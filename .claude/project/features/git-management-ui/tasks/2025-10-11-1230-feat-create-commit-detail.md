# Create CommitDetail Component

## Type
feat

## Description
Create the CommitDetail component that displays comprehensive information about a selected commit, including full message, author details, timestamp, parent commits, changed files statistics, and embedded diff viewer.

## Acceptance Criteria
- [ ] `components/commit/CommitDetail.tsx` component created
- [ ] Displays full commit hash with copy button
- [ ] Shows author name, email, and avatar
- [ ] Displays commit date and time (formatted)
- [ ] Shows full commit message with proper formatting
- [ ] Lists parent commits as clickable links
- [ ] Displays file change statistics (+X -Y)
- [ ] Lists all changed files with status badges
- [ ] Integrates DiffViewer for viewing changes
- [ ] Handles merge commits (multiple parents)
- [ ] Loading state while fetching details

## Technical Details
- **File to create**: `frontend/src/components/commit/CommitDetail.tsx`

- **Implementation**:
  ```typescript
  import { useState, useEffect } from 'react';
  import { Copy, User, Calendar, GitCommit } from 'lucide-react';
  import { formatDistanceToNow } from 'date-fns';
  import { DiffViewer } from '@/components/diff/DiffViewer';
  import { useCommitStore } from '@/stores/commitStore';
  import { fetchCommitDiff } from '@/api/commit';
  import type { Commit, DiffResult } from '@/types/git';

  interface CommitDetailProps {
    commit: Commit;
  }

  export function CommitDetail({ commit }: CommitDetailProps) {
    const [diff, setDiff] = useState<DiffResult | null>(null);
    const [isLoadingDiff, setIsLoadingDiff] = useState(false);

    useEffect(() => {
      async function loadDiff() {
        setIsLoadingDiff(true);
        try {
          const diffData = await fetchCommitDiff(commit.hash);
          setDiff(diffData);
        } catch (error) {
          console.error('Failed to load commit diff:', error);
        } finally {
          setIsLoadingDiff(false);
        }
      }

      loadDiff();
    }, [commit.hash]);

    const copyHash = () => {
      navigator.clipboard.writeText(commit.hash);
      // Show toast notification
    };

    return (
      <div className="commit-detail h-full flex flex-col bg-white">
        {/* Header Section */}
        <div className="flex-shrink-0 border-b border-gray-200 p-6">
          {/* Commit Hash */}
          <div className="flex items-center gap-2 mb-4">
            <GitCommit className="w-5 h-5 text-gray-500" />
            <span className="font-mono text-sm text-gray-600">
              {commit.hash}
            </span>
            <button
              onClick={copyHash}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy hash"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Author Info */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {commit.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {commit.author.name}
              </div>
              <div className="text-sm text-gray-600">{commit.author.email}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Commit Message */}
          <div className="bg-gray-50 rounded p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
              {commit.message}
            </pre>
          </div>

          {/* Parent Commits */}
          {commit.parents && commit.parents.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Parent{commit.parents.length > 1 ? 's' : ''}:
              </div>
              <div className="flex flex-wrap gap-2">
                {commit.parents.map(parentHash => (
                  <button
                    key={parentHash}
                    className="font-mono text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    onClick={() => {
                      // Navigate to parent commit
                    }}
                  >
                    {parentHash.slice(0, 7)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {diff && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="text-gray-700">
                {diff.files.length} file{diff.files.length !== 1 ? 's' : ''} changed
              </span>
              <span className="text-green-600 font-semibold">
                +{diff.totalAdditions}
              </span>
              <span className="text-red-600 font-semibold">
                -{diff.totalDeletions}
              </span>
            </div>
          )}
        </div>

        {/* Diff Viewer */}
        <div className="flex-1 overflow-hidden">
          <DiffViewer diff={diff} isLoading={isLoadingDiff} />
        </div>
      </div>
    );
  }
  ```

## Estimated Time
3 hours

## Dependencies
- Depends on: 2025-10-11-1015-feat-create-diff-viewer.md
- Depends on: 2025-10-11-0615-feat-create-commit-store.md

## Notes
- Use date-fns for relative time formatting ("2 hours ago")
- Avatar placeholder uses first letter of author name
- Consider integrating Gravatar for author avatars (future enhancement)
- Copy hash button should show success toast
- Parent commits should be clickable to navigate
