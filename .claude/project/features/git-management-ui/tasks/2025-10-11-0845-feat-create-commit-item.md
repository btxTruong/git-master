# Create CommitItem Component

## Type
feat

## Description
Create the CommitItem component that displays a single commit row in the commit list. Shows abbreviated hash, author name, relative time, and commit message with proper styling and hover effects.

## Acceptance Criteria
- [ ] `components/commit/CommitItem.tsx` created
- [ ] Displays commit hash (first 7 characters)
- [ ] Displays author name
- [ ] Displays relative time (e.g., "2 hours ago")
- [ ] Displays commit subject (truncated if too long)
- [ ] Click handler to select commit
- [ ] Selected state shows different background color
- [ ] Hover effect for better UX
- [ ] Height is exactly 60px to match virtualization estimate
- [ ] Responsive layout that handles long messages

## Technical Details

**File to create**: `frontend/src/components/commit/CommitItem.tsx`

**Implementation**:
```typescript
import { formatDistanceToNow } from 'date-fns';
import { GitCommit } from 'lucide-react';
import type { Commit } from '@/types/git';

interface CommitItemProps {
  commit: Commit;
  isSelected: boolean;
  onClick: () => void;
}

export function CommitItem({ commit, isSelected, onClick }: CommitItemProps) {
  const relativeTime = formatDistanceToNow(new Date(commit.authorDate), {
    addSuffix: true,
  });

  return (
    <div
      onClick={onClick}
      className={`
        h-[60px] px-4 py-2 border-b border-gray-200 cursor-pointer
        transition-colors duration-150
        flex items-center gap-3
        ${isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
        }
      `}
    >
      {/* Commit icon */}
      <GitCommit
        className={`w-4 h-4 flex-shrink-0 ${
          isSelected ? 'text-blue-600' : 'text-gray-400'
        }`}
      />

      {/* Commit info */}
      <div className="flex-1 min-w-0 flex items-center gap-4">
        {/* Hash */}
        <span
          className={`
            font-mono text-xs flex-shrink-0
            ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-500'}
          `}
        >
          {commit.abbrevHash || commit.hash.substring(0, 7)}
        </span>

        {/* Message */}
        <span
          className={`
            flex-1 truncate text-sm
            ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}
          `}
          title={commit.subject}
        >
          {commit.subject}
        </span>

        {/* Author and time */}
        <div className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-500">
          <span className="max-w-[120px] truncate" title={commit.author.name}>
            {commit.author.name}
          </span>
          <span>•</span>
          <span className="whitespace-nowrap" title={commit.authorDate.toString()}>
            {relativeTime}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Create utility for date formatting**:

Update `frontend/src/utils/formatters.ts`:
```typescript
import { formatDistanceToNow, format } from 'date-fns';

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatAbsoluteTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPpp'); // e.g., "Apr 29, 2021, 12:00:00 PM"
}

export function formatCommitHash(hash: string, length = 7): string {
  return hash.substring(0, length);
}
```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0530-feat-create-git-domain-types.md
- Requires: date-fns library (already installed)

## Notes
- Height must be exactly 60px to match virtualization estimate
- Use `truncate` class to prevent long messages from breaking layout
- Selected state uses left border for clear visual indicator
- Relative time updates are not real-time (would require re-render)
- `title` attribute provides tooltip for truncated text
- Use monospace font for commit hash
- Author name is truncated at 120px to prevent layout issues
