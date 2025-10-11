import { useState } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { CommitList } from '@/components/commit/CommitList';
import { CommitDetail } from '@/components/commit/CommitDetail';
import { CommitSearch } from '@/components/commit/CommitSearch';
import { CommitFilters } from '@/components/commit/CommitFilters';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderOpen, History } from 'lucide-react';

function HistoryView() {
  const { currentRepository } = useRepositoryStore();
  const [selectedCommit, _setSelectedCommit] = useState<any>(null);

  if (!currentRepository) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={<FolderOpen className="w-16 h-16 text-gray-400" />}
          title="No Repository Open"
          description="Open a Git repository to view its commit history"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with search and filters */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <History className="w-5 h-5" />
            Commit History
          </h1>
        </div>
        <CommitSearch />
        <CommitFilters />
      </div>

      {/* Main content: commit list + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Commit list (left side) */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <CommitList />
        </div>

        {/* Commit detail (right side) */}
        <div className="w-1/2 overflow-hidden">
          {selectedCommit ? (
            <CommitDetail commit={selectedCommit} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={<History className="w-12 h-12 text-gray-400" />}
                title="No Commit Selected"
                description="Select a commit from the list to view its details"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryView;
