# Integrate DiffViewer in CommitDetail

## Type
feat

## Description
Integrate the DiffViewer component into the CommitDetail view with proper data fetching, loading states, error handling, and file navigation. Allow switching between files and toggling diff view modes.

## Acceptance Criteria
- [ ] DiffViewer embedded in CommitDetail component
- [ ] Fetches commit diff from backend via Wails
- [ ] Loading spinner shown while fetching diff
- [ ] Error state displayed if diff fetch fails
- [ ] File list sidebar for quick navigation
- [ ] Clicking file scrolls to that file's diff
- [ ] Diff view mode toggle (unified/split) works
- [ ] Large diffs load progressively
- [ ] Back button returns to commit list

## Technical Details

### API Integration
```typescript
// api/commit.ts
import { GetCommitDiff } from '../../wailsjs/go/services/CommitService';

export async function fetchCommitDiff(hash: string): Promise<DiffResult> {
  try {
    const diff = await GetCommitDiff(hash);
    return diff;
  } catch (error) {
    console.error('Failed to fetch commit diff:', error);
    throw error;
  }
}
```

### File Navigation Sidebar
```typescript
// Add to CommitDetail component
const [selectedFileIndex, setSelectedFileIndex] = useState(0);

<div className="flex h-full">
  {/* File sidebar */}
  <div className="w-64 border-r border-gray-200 overflow-auto">
    <div className="p-2">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
        Changed Files ({diff?.files.length || 0})
      </div>
      {diff?.files.map((file, index) => (
        <button
          key={file.path}
          onClick={() => {
            setSelectedFileIndex(index);
            // Scroll to file
          }}
          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
            selectedFileIndex === index ? 'bg-blue-50 text-blue-700' : ''
          }`}
        >
          <div className="font-mono truncate">{file.path}</div>
          <div className="text-xs text-gray-500">
            +{file.additions} -{file.deletions}
          </div>
        </button>
      ))}
    </div>
  </div>

  {/* Diff viewer */}
  <div className="flex-1">
    <DiffViewer diff={diff} isLoading={isLoadingDiff} />
  </div>
</div>
```

### View Mode Toggle
```typescript
import { useUIStore } from '@/stores/uiStore';

function DiffViewModeToggle() {
  const { diffViewMode, setDiffViewMode } = useUIStore();

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
      <span className="text-sm text-gray-600">View:</span>
      <button
        onClick={() => setDiffViewMode('unified')}
        className={`px-3 py-1 text-sm rounded ${
          diffViewMode === 'unified'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Unified
      </button>
      <button
        onClick={() => setDiffViewMode('split')}
        className={`px-3 py-1 text-sm rounded ${
          diffViewMode === 'split'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Split
      </button>
    </div>
  );
}
```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-1230-feat-create-commit-detail.md
- Depends on: 2025-10-11-1015-feat-create-diff-viewer.md

## Notes
- File navigation should smooth scroll to selected file
- Consider adding keyboard shortcuts (J/K for prev/next file)
- Large diffs should be loaded progressively or virtualized
- Error state should show retry button
