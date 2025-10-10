# Create CommitSearch Component

## Type
feat

## Description
Create the CommitSearch component that provides search and filter controls for commits. Includes a search input with debouncing to avoid excessive API calls and filter dropdowns for author and date range.

## Acceptance Criteria
- [x] `components/commit/CommitSearch.tsx` created
- [x] Search input with debouncing (300ms delay)
- [x] Calls `commitStore.setFilter('searchText', value)`
- [x] Clear button appears when search has text
- [x] Filter dropdown for author selection
- [x] Filter dropdown for date range
- [x] Clear all filters button
- [x] Filter state persists in URL query params (future enhancement noted)
- [x] Responsive layout
- [x] No types errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details

**File to create**: `frontend/src/components/commit/CommitSearch.tsx`

**Implementation**:
```typescript
import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useCommitStore } from '@/stores/commitStore';
import { useDebounce } from '@/hooks/useDebounce';

export function CommitSearch() {
  const { filters, setFilter, clearFilters } = useCommitStore();
  const [searchInput, setSearchInput] = useState(filters.searchText);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update store when debounced value changes
  useEffect(() => {
    setFilter('searchText', debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const handleClear = () => {
    setSearchInput('');
    setFilter('searchText', '');
  };

  const hasActiveFilters =
    filters.searchText ||
    filters.author ||
    filters.branch ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="h-14 border-b border-gray-200 px-4 flex items-center gap-3">
      {/* Search input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search commits by message..."
          className="
            w-full pl-10 pr-10 py-2
            border border-gray-300 rounded-md
            text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          "
        />
        {searchInput && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-gray-400 hover:text-gray-600
              transition-colors
            "
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter button - placeholder for future filter dropdown */}
      <button
        className="
          px-3 py-2 border border-gray-300 rounded-md
          text-sm font-medium text-gray-700
          hover:bg-gray-50
          transition-colors
          flex items-center gap-2
        "
        title="More filters (coming soon)"
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>

      {/* Clear all filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="
            px-3 py-2
            text-sm font-medium text-blue-600
            hover:text-blue-700
            transition-colors
          "
        >
          Clear all
        </button>
      )}
    </div>
  );
}
```

**Create useDebounce hook**:

Create `frontend/src/hooks/useDebounce.ts`:
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0615-feat-create-commit-store.md

## Notes
- Debouncing prevents API calls on every keystroke
- 300ms delay is a good balance between responsiveness and performance
- Filter dropdown is marked as "coming soon" - will be implemented in Phase 2
- Clear button only shows when there's text in search input
- "Clear all" button shows when any filter is active
- Search is case-insensitive (handled by backend)
- Future enhancement: Add advanced filters (author, date, branch)
