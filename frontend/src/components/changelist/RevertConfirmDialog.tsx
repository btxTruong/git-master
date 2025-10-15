import { useEffect, useState } from 'react';

interface RevertConfirmDialogProps {
  isOpen: boolean;
  filePath: string | null;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevertConfirmDialog({
  isOpen,
  filePath,
  message,
  onConfirm,
  onCancel,
}: RevertConfirmDialogProps) {
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

  if (!isOpen || !filePath) {
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
          Revert Changes
        </h2>

        <div className="mb-6">
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{message}</p>

          <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              ⚠️ This action cannot be undone.
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
            Revert Changes
          </button>
        </div>
      </div>
    </div>
  );
}
