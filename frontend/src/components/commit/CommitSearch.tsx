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
    filters.searchText || filters.author || filters.branch || filters.dateFrom || filters.dateTo;

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
