import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useCommitStore } from '@/stores/commitStore';
import { useDebounce } from '@/hooks/useDebounce';
import { CommitFilters } from './CommitFilters';

export function CommitSearch() {
  const {
    filters,
    setFilter,
    clearFilters,
    selectedCommit,
    selectCommit,
    requestScrollToCommit,
    isLoading,
    commits,
    loadCommits,
    currentPage,
    hasMore,
  } = useCommitStore();
  const [searchInput, setSearchInput] = useState(filters.searchText);
  const [pendingScrollHash, setPendingScrollHash] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchInput, 300);
  const prevLoadingRef = useRef(isLoading);
  const loadingMoreRef = useRef(false);

  const isHashSearch = (searchText: string): boolean => {
    const trimmed = searchText.trim();
    const hasNoSpecialChars = /^[a-f0-9]+$/.test(trimmed);
    return trimmed.length >= 4 && hasNoSpecialChars;
  };

  // Update store when debounced value changes
  useEffect(() => {
    setFilter('searchText', debouncedSearch);
  }, [debouncedSearch, setFilter]);

  // Handle pending scroll after commits finish loading
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const justFinishedLoading = wasLoading && !isLoading;

    if (pendingScrollHash && justFinishedLoading && commits.length > 0) {
      const commit = commits.find((c) => c.hash === pendingScrollHash);

      if (commit) {
        selectCommit(commit);
        requestScrollToCommit(pendingScrollHash);
        loadingMoreRef.current = false;

        queueMicrotask(() => {
          setPendingScrollHash(null);
        });
      } else if (hasMore && !loadingMoreRef.current && currentPage === 0) {
        // Only start loading more if we're on page 0 (initial load after clear)
        loadingMoreRef.current = true;
        setTimeout(() => {
          loadCommits(1);
        }, 50);
      } else if (hasMore && loadingMoreRef.current && currentPage > 0) {
        // Continue loading if we've already started
        setTimeout(() => {
          loadCommits(currentPage + 1);
        }, 50);
      } else if (!hasMore) {
        loadingMoreRef.current = false;
        queueMicrotask(() => {
          setPendingScrollHash(null);
        });
      }
    }

    prevLoadingRef.current = isLoading;
  }, [
    pendingScrollHash,
    isLoading,
    commits,
    selectCommit,
    requestScrollToCommit,
    loadCommits,
    currentPage,
    hasMore,
  ]);

  const handleClear = () => {
    const wasHashSearch = isHashSearch(searchInput);
    let commitHashToScrollTo = selectedCommit?.hash;

    // If no commit is selected but we have a hash search, find the first matching commit
    if (wasHashSearch && !commitHashToScrollTo && commits.length > 0) {
      const searchHash = searchInput.trim().toLowerCase();
      const matchingCommit = commits.find(
        (c) =>
          c.hash.toLowerCase().includes(searchHash) ||
          c.shortHash.toLowerCase().includes(searchHash)
      );
      commitHashToScrollTo = matchingCommit?.hash;
    }

    setSearchInput('');
    setFilter('searchText', '');

    if (wasHashSearch && commitHashToScrollTo) {
      loadingMoreRef.current = false;
      setPendingScrollHash(commitHashToScrollTo);
    }
  };

  const handleClearAll = () => {
    const wasHashSearch = isHashSearch(searchInput);
    let commitHashToScrollTo = selectedCommit?.hash;

    // If no commit is selected but we have a hash search, find the first matching commit
    if (wasHashSearch && !commitHashToScrollTo && commits.length > 0) {
      const searchHash = searchInput.trim().toLowerCase();
      const matchingCommit = commits.find(
        (c) =>
          c.hash.toLowerCase().includes(searchHash) ||
          c.shortHash.toLowerCase().includes(searchHash)
      );
      commitHashToScrollTo = matchingCommit?.hash;
    }

    setSearchInput('');
    clearFilters();

    if (wasHashSearch && commitHashToScrollTo) {
      loadingMoreRef.current = false;
      setPendingScrollHash(commitHashToScrollTo);
    }
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
