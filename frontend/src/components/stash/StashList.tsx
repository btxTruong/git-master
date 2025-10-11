import { useEffect } from 'react';
import { useStashStore } from '@/stores/stashStore';
import { Archive, Plus, Loader2 } from 'lucide-react';
import { StashItem } from './StashItem';
import { CreateStashDialog } from './CreateStashDialog';
import { useState } from 'react';

export function StashList() {
  const { stashes, isLoading, error, loadStashes } = useStashStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadStashes();
  }, [loadStashes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={loadStashes}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Archive className="w-5 h-5" />
          Stashes
        </h3>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Stash
        </button>
      </div>

      {/* Create Stash Dialog */}
      {showCreateDialog && <CreateStashDialog onClose={() => setShowCreateDialog(false)} />}

      {/* Stash List */}
      {stashes.length === 0 ? (
        <div className="text-gray-400 text-center py-12">
          <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No stashes yet</p>
          <p className="text-sm mt-2">Create a stash to temporarily save your changes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stashes.map((stash) => (
            <StashItem key={stash.index} stash={stash} />
          ))}
        </div>
      )}
    </div>
  );
}
