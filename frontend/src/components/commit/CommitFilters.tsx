import { useState, useEffect } from 'react';
import { X, Calendar, User, GitBranch } from 'lucide-react';
import { useCommitStore } from '@/stores/commitStore';
import { Dropdown } from '@/components/common/Dropdown';

export function CommitFilters() {
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

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setFilter('dateFrom', date);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setFilter('dateTo', date);
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const activeFilterCount = [
    filters.author,
    filters.branch,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

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
      <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Filter Commits</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Author filter */}
            <Dropdown
              label="Author"
              icon={User}
              value={filters.author}
              onChange={(value) => setFilter('author', value)}
              options={authors}
              placeholder="All authors"
            />

            {/* Branch filter */}
            <Dropdown
              label="Branch"
              icon={GitBranch}
              value={filters.branch}
              onChange={(value) => setFilter('branch', value)}
              options={branches}
              placeholder="All branches"
            />

            {/* Date range filters */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">From</label>
                  <input
                    type="date"
                    value={formatDateForInput(filters.dateFrom)}
                    onChange={handleDateFromChange}
                    className="
                      w-full px-3 py-2 border border-gray-300 rounded-md
                      text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">To</label>
                  <input
                    type="date"
                    value={formatDateForInput(filters.dateTo)}
                    onChange={handleDateToChange}
                    className="
                      w-full px-3 py-2 border border-gray-300 rounded-md
                      text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
