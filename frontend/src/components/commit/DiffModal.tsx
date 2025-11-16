import { useEffect } from 'react';
import { X } from 'lucide-react';
import { FullFileSplitDiffViewer } from '@/components/diff/FullFileSplitDiffViewer';
import type { models } from '../../../wailsjs/go/models';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: models.FileChange | null;
  isLoading: boolean;
  fileContent?: { oldContent: string; newContent: string } | null;
  oldCommitHash?: string;
  newCommitHash?: string;
}

export function DiffModal({
  isOpen,
  onClose,
  selectedFile,
  isLoading,
  fileContent,
  oldCommitHash,
  newCommitHash,
}: DiffModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedFile) {
    return null;
  }

  const fileName = selectedFile.newPath || selectedFile.oldPath;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-screen h-screen bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {fileName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Always use split diff viewer */}
        <div className="flex-1 overflow-hidden">
          <FullFileSplitDiffViewer
            oldContent={fileContent?.oldContent || ''}
            newContent={fileContent?.newContent || ''}
            fileName={fileName}
            isLoading={isLoading}
            oldCommitHash={oldCommitHash}
            newCommitHash={newCommitHash}
          />
        </div>
      </div>
    </div>
  );
}
