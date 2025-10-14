import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderOpen } from 'lucide-react';
import { SelectSaveDirectory } from '../../../wailsjs/go/main/App';

interface SavePatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filename: string, directory: string) => Promise<void>;
  commitHash: string;
}

export function SavePatchDialog({ isOpen, onClose, onConfirm, commitHash }: SavePatchDialogProps) {
  const [filename, setFilename] = useState('');
  const [directory, setDirectory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFilename(`${commitHash}.diff`);
      setDirectory('.');
      setError('');
    }
  }, [isOpen, commitHash]);

  const handleSelectDirectory = async () => {
    try {
      const selectedDir = await SelectSaveDirectory();
      if (selectedDir) {
        setDirectory(selectedDir);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select directory');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!filename.trim()) {
      setError('Filename is required');
      return;
    }

    if (!directory.trim()) {
      setError('Please select a directory');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(filename.trim(), directory.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patch file');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Save Patch File
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="filename"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Filename
            </label>
            <input
              id="filename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="commit.diff"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Directory
            </label>
            <div className="flex gap-2">
              <div
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                            bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm
                            overflow-x-auto whitespace-nowrap"
              >
                {directory || 'No directory selected'}
              </div>
              <button
                type="button"
                onClick={handleSelectDirectory}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors
                         flex items-center gap-2"
                disabled={isLoading}
              >
                <FolderOpen className="w-4 h-4" />
                Browse
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select the directory where the patch file will be saved
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white
                       bg-blue-600 hover:bg-blue-700 rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
