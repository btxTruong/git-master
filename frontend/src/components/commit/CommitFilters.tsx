import { useState, useEffect } from 'react';
import { X, User, GitBranch } from 'lucide-react';
import { useCommitStore } from '@/stores/commitStore';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { DatePicker } from '@/components/common/DatePicker';

interface CommitFiltersProps {
  mode?: 'inline' | 'modal';
}

export function CommitFilters({ mode = 'modal' }: CommitFiltersProps) {
  const { filters, setFilter, commits } = useCommitStore();
  const [isOpen, setIsOpen] = useState(false);

  // Sync filters with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Update URL when filters change
    if (filters.author) params.set('author', filters.author);
    else params.delete('author');

    if (filters.branch) params.set('branch', filters.branch);
    else params.delete('branch');

    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
    else params.delete('dateFrom');

    if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
    else params.delete('dateTo');

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Extract unique authors from commits
  const authors = Array.from(new Set(commits.map((c) => c.author.email))).sort();

  // Extract unique branches from commit refs
  const branches = Array.from(
    new Set(
      commits.flatMap((c) =>
        c.refs.filter((ref) => ref.startsWith('origin/') || !ref.includes('/'))
      )
    )
  ).sort();

  const activeFilterCount = [
    filters.author,
    filters.branch,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  // Inline mode: render filters horizontally
  if (mode === 'inline') {
    return (
      <div className="flex items-center gap-3">
        <SearchableDropdown
          label=""
          value={filters.author}
          onChange={(value) => setFilter('author', value)}
          options={authors}
          placeholder="Author..."
          className="min-w-[160px]"
        />

        <SearchableDropdown
          label=""
          value={filters.branch}
          onChange={(value) => setFilter('branch', value)}
          options={branches}
          placeholder="Branch..."
          className="min-w-[160px]"
        />

        <DatePicker
          label=""
          value={filters.dateFrom}
          onChange={(date) => setFilter('dateFrom', date)}
          placeholder="From date"
          className="w-40"
        />

        <DatePicker
          label=""
          value={filters.dateTo}
          onChange={(date) => setFilter('dateTo', date)}
          placeholder="To date"
          className="w-40"
        />
      </div>
    );
  }

  // Modal mode: render as dropdown button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="
          px-3 py-2 border border-gray-300 rounded-md
          text-sm font-medium text-gray-700
          hover:bg-gray-50
          transition-colors
          flex items-center gap-2
          relative
        "
      >
        <span className="w-4 h-4">🔍</span>
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(false)}
        className="
          px-3 py-2 border border-blue-500 rounded-md
          text-sm font-medium text-blue-600
          bg-blue-50
          hover:bg-blue-100
          transition-colors
          flex items-center gap-2
        "
      >
        <span className="w-4 h-4">🔍</span>
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter dropdown */}
      <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Filter Commits
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Author filter */}
            <SearchableDropdown
              label="Author"
              icon={User}
              value={filters.author}
              onChange={(value) => setFilter('author', value)}
              options={authors}
              placeholder="Search authors..."
            />

            {/* Branch filter */}
            <SearchableDropdown
              label="Branch"
              icon={GitBranch}
              value={filters.branch}
              onChange={(value) => setFilter('branch', value)}
              options={branches}
              placeholder="Search branches..."
            />

            {/* Date range filters */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Date Range
              </div>
              <div className="space-y-3">
                <DatePicker
                  label="From"
                  value={filters.dateFrom}
                  onChange={(date) => setFilter('dateFrom', date)}
                  placeholder="Select start date"
                />
                <DatePicker
                  label="To"
                  value={filters.dateTo}
                  onChange={(date) => setFilter('dateTo', date)}
                  placeholder="Select end date"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
