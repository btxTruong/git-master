import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCommitStore } from '@/stores/commitStore';
import { useDebounce } from '@/hooks/useDebounce';
import { CommitFilters } from './CommitFilters';

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

  const handleClearAll = () => {
    setSearchInput('');
    clearFilters();
  };

  const hasActiveFilters =
    searchInput || filters.author || filters.branch || filters.dateFrom || filters.dateTo;

  return (
    <div className="border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search commits by message or hash..."
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

        {/* Inline filters - visible on large screens */}
        <div className="hidden lg:flex">
          <CommitFilters mode="inline" />
        </div>

        {/* Modal filter button - visible on small screens */}
        <div className="lg:hidden">
          <CommitFilters mode="modal" />
        </div>

        {/* Clear all filters - hidden on large screens */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="
              lg:hidden
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
    </div>
  );
}
