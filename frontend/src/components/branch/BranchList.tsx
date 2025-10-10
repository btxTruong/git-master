import { useEffect, useState } from 'react';
import { GetBranches, CheckoutBranch, CreateBranch, DeleteBranch } from '../../../wailsjs/go/services/RepositoryService';
import { GitBranch, Plus, Trash2, Check, GitMerge, Cloud } from 'lucide-react';

interface Branch {
  name: string;
  isHead: boolean;
  isRemote: boolean;
  remote: string;
  commitHash: string;
  upstream: string;
}

interface BranchListData {
  current: string;
  local: Branch[];
  remote: Branch[];
}

export function BranchList() {
  const [branches, setBranches] = useState<BranchListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GetBranches();
      setBranches(result as BranchListData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (branchName: string) => {
    try {
      await CheckoutBranch(branchName);
      await loadBranches(); // Reload to update current branch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout branch');
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;

    setIsCreating(true);
    try {
      await CreateBranch(newBranchName.trim());
      setNewBranchName('');
      setShowCreateDialog(false);
      await loadBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!confirm(`Delete branch "${branchName}"?`)) return;

    try {
      await DeleteBranch(branchName, false);
      await loadBranches();
    } catch (err) {
      // Try force delete if normal delete fails
      if (confirm(`Branch "${branchName}" has unmerged changes. Force delete?`)) {
        try {
          await DeleteBranch(branchName, true);
          await loadBranches();
        } catch (forceErr) {
          setError(forceErr instanceof Error ? forceErr.message : 'Failed to delete branch');
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading branches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={loadBranches}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!branches) {
    return <div className="text-gray-400 p-4">No branches found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Local Branches</h3>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          <Plus className="w-4 h-4" />
          New Branch
        </button>
      </div>

      {/* Create Branch Dialog */}
      {showCreateDialog && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Branch Name</label>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
              placeholder="feature/my-feature"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateBranch}
              disabled={!newBranchName.trim() || isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateDialog(false);
                setNewBranchName('');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Local Branches */}
      <div className="space-y-2">
        {branches.local.map((branch) => (
          <div
            key={branch.name}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              branch.isHead
                ? 'bg-blue-900/30 border-2 border-blue-600'
                : 'bg-gray-800 hover:bg-gray-750'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <GitBranch className={`w-5 h-5 flex-shrink-0 ${branch.isHead ? 'text-blue-400' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium truncate ${branch.isHead ? 'text-blue-200' : 'text-gray-200'}`}>
                    {branch.name}
                  </span>
                  {branch.isHead && (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <Check className="w-3 h-3" />
                      Current
                    </span>
                  )}
                </div>
                {branch.upstream && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <GitMerge className="w-3 h-3" />
                    <span>→ {branch.upstream}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {branch.commitHash.substring(0, 7)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!branch.isHead && (
                <>
                  <button
                    onClick={() => handleCheckout(branch.name)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch.name)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Remote Branches */}
      {branches.remote.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Remote Branches
          </h3>
          <div className="space-y-2">
            {branches.remote.map((branch) => (
              <div
                key={`${branch.remote}/${branch.name}`}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Cloud className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-200 truncate">
                      {branch.remote}/{branch.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {branch.commitHash.substring(0, 7)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
