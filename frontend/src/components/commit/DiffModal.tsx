import { X } from 'lucide-react';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { FullFileDiffViewer } from '@/components/diff/FullFileDiffViewer';
import type { DiffResult } from '@/types/git';
import type { models } from '../../../wailsjs/go/models';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: models.FileChange | null;
  diff: DiffResult | null;
  isLoading: boolean;
  fileContent?: { oldContent: string; newContent: string } | null;
}

export function DiffModal({
  isOpen,
  onClose,
  selectedFile,
  diff,
  isLoading,
  fileContent,
}: DiffModalProps) {
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
        className="w-[95vw] h-[90vh] max-w-[1800px] rounded-lg bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {fileName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Status: {selectedFile.status} • +{selectedFile.insertions} -{selectedFile.deletions}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {fileContent ? (
            <FullFileDiffViewer
              oldContent={fileContent.oldContent}
              newContent={fileContent.newContent}
              isLoading={isLoading}
            />
          ) : (
            <DiffViewer diff={diff} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
