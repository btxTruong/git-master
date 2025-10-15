import { useEffect, useState } from 'react';

interface DeleteGroupDialogProps {
  isOpen: boolean;
  groupName: string | null;
  fileCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteGroupDialog({
  isOpen,
  groupName,
  fileCount,
  onConfirm,
  onCancel,
}: DeleteGroupDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !isDialogOpen) {
      setIsDialogOpen(true);
    } else if (!isOpen && isDialogOpen) {
      setIsDialogOpen(false);
    }
  }, [isOpen, isDialogOpen]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isOpen || !groupName) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Delete Group
        </h2>

        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the group{' '}
            <span className="font-semibold">"{groupName}"</span>?
          </p>

          {fileCount > 0 && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              This group contains {fileCount} file{fileCount !== 1 ? 's' : ''}.
            </p>
          )}

          <div className="mt-4 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ℹ️ Files will not be deleted from disk, only removed from the group.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Group
          </button>
        </div>
      </div>
    </div>
  );
}
