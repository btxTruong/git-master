import { useState, memo } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useChangelistStore } from '@/stores/changelistStore';
import { useRepositoryStore } from '@/stores/repositoryStore';

interface GroupActionsToolbarProps {
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  allExpanded?: boolean;
}

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Dialog for creating a new changelist group
 */
function CreateGroupDialog({ isOpen, onClose, onCreateGroup, isLoading }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const groups = useChangelistStore((state) => state.groups);

  if (!isOpen) {
    return null;
  }

  const handleCreate = async () => {
    const trimmedName = groupName.trim();

    // Validate group name
    if (!trimmedName) {
      setError('Group name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Group name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 100) {
      setError('Group name must be less than 100 characters');
      return;
    }

    // Check for duplicate names
    if (groups.some((g) => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('A group with this name already exists');
      return;
    }

    try {
      await onCreateGroup(trimmedName);
      // Reset form on success
      setGroupName('');
      setError(null);
      onClose();
    } catch {
      // Error handling is done by the store (toast notification)
      // Keep the dialog open so user can try again
    }
  };

  const handleInputChange = (value: string) => {
    setGroupName(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to create group
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
    // Escape to close
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleCancel = () => {
    setGroupName('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Create New Group
        </h2>

        <div className="mb-4">
          <label
            htmlFor="group-name"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Group Name
          </label>
          <input
            type="text"
            id="group-name"
            value={groupName}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Feature work, Bug fixes"
            className={`w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={isLoading}
            autoFocus
          />

          {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Create a custom group to organize your working changes
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !groupName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Toolbar for global changelist actions
 * Provides buttons for creating groups and managing group display
 */
export const GroupActionsToolbar = memo(function GroupActionsToolbar({
  onExpandAll,
  onCollapseAll,
  allExpanded = false,
}: GroupActionsToolbarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const createGroup = useChangelistStore((state) => state.createGroup);
  const isLoading = useChangelistStore((state) => state.isLoading);
  const repositoryPath = useRepositoryStore((state) => state.currentRepository?.path);

  const handleCreateGroup = async (groupName: string) => {
    if (!repositoryPath) {
      throw new Error('No repository selected');
    }
    await createGroup(repositoryPath, groupName);
  };

  const handleToggleExpandAll = () => {
    if (allExpanded && onCollapseAll) {
      onCollapseAll();
    } else if (!allExpanded && onExpandAll) {
      onExpandAll();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
        {/* Create Group Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={isLoading}
        >
          Create Group
        </Button>

        {/* Expand/Collapse All Button */}
        {(onExpandAll || onCollapseAll) && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={
              allExpanded ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            }
            onClick={handleToggleExpandAll}
            disabled={isLoading}
            title={allExpanded ? 'Collapse all groups' : 'Expand all groups'}
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
        )}
      </div>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateGroup={handleCreateGroup}
        isLoading={isLoading}
      />
    </>
  );
});
