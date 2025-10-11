# Implement Commit Filters

## Type
feat

## Description
Implement comprehensive commit filtering functionality including filters by author, date range, branch, and search text. Filters should work independently and in combination.

## Acceptance Criteria
- [x] Filter by author dropdown populated from commit data
- [x] Date range picker for from/to dates
- [x] Branch filter dropdown
- [x] Search text filter (commit message)
- [x] Multiple filters combine with AND logic
- [x] Clear all filters button
- [x] Filter state persists in URL params
- [x] Loading state while applying filters
- [x] Results update in real-time

## Technical Details
- **Implementation**:
  ```typescript
  // Add to commitStore
  interface CommitFilters {
    author: string | null;
    dateFrom: Date | null;
    dateTo: Date | null;
    branch: string | null;
    searchText: string;
  }

  setFilter: (key: keyof CommitFilters, value: any) => {
    set(state => ({
      filters: { ...state.filters, [key]: value }
    }));
    // Reload commits with new filters
  }
  ```

## Estimated Time
3 hours

## Dependencies
- Depends on: 2025-10-11-0615-feat-create-commit-store.md

## Notes
- Author list should be derived from loaded commits
- Date picker can use native HTML5 date input
- Consider debouncing search text input
