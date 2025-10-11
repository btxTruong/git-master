import { useEffect } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useCommitStore } from '@/stores/commitStore';
import { CommitList } from '@/components/commit/CommitList';
import { CommitSearch } from '@/components/commit/CommitSearch';
import { CommitFilters } from '@/components/commit/CommitFilters';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderOpen, History } from 'lucide-react';

function HistoryView() {
  const { currentRepository } = useRepositoryStore();
  const { loadCommits, reset } = useCommitStore();

  useEffect(() => {
    if (currentRepository) {
      loadCommits(0);
    } else {
      reset();
    }
  }, [currentRepository, loadCommits, reset]);

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

      {/* Main content: commit list */}
      <div className="flex-1 overflow-hidden">
        <CommitList />
      </div>
    </div>
  );
}

export default HistoryView;
