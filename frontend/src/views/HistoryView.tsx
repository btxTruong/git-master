import { useEffect, useState, useRef, useCallback } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useCommitStore } from '@/stores/commitStore';
import { CommitList } from '@/components/commit/CommitList';
import { CommitSearch } from '@/components/commit/CommitSearch';
import { FileTreePanel } from '@/components/commit/FileTreePanel';
import { DiffModal } from '@/components/commit/DiffModal';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderOpen, History } from 'lucide-react';
import {
  GetCommitDetail,
  GetFileContentAtCommit,
} from '../../wailsjs/go/services/RepositoryService';
import type { models } from '../../wailsjs/go/models';

const MIN_COMMIT_LIST_PERCENT = 30;
const MAX_COMMIT_LIST_PERCENT = 85;
const DEFAULT_COMMIT_LIST_PERCENT = 70;

function HistoryView() {
  const { currentRepository } = useRepositoryStore();
  const { selectedCommit, loadCommits, reset } = useCommitStore();
  const [commitDetail, setCommitDetail] = useState<models.CommitDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<models.FileChange | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [fileContent, setFileContent] = useState<{ oldContent: string; newContent: string } | null>(
    null
  );
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [commitListPercent, setCommitListPercent] = useState(DEFAULT_COMMIT_LIST_PERCENT);
  const [isResizing, setIsResizing] = useState(false);
  const commitListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentRepository) {
      loadCommits(0);
    } else {
      reset();
    }

    // Reset local state when repository changes
    setCommitDetail(null);
    setSelectedFile(null);
    setFileContent(null);
  }, [currentRepository, loadCommits, reset]);

  // Load commit details when a commit is selected
  useEffect(() => {
    if (selectedCommit) {
      setIsLoadingDetail(true);
      GetCommitDetail(selectedCommit.hash)
        .then((detail) => {
          setCommitDetail(detail);
          setSelectedFile(null); // Reset selected file when commit changes
        })
        .catch((error) => {
          console.error('Failed to load commit details:', error);
          setCommitDetail(null);
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
    } else {
      setCommitDetail(null);
      setSelectedFile(null);
    }
  }, [selectedCommit]);

  const handleFileSelect = (file: models.FileChange) => {
    setSelectedFile(file);
    setFileContent(null);
  };

  const handleCloseDiffModal = () => {
    setSelectedFile(null);
    setFileContent(null);
  };

  // Load full file content when a file is selected
  useEffect(() => {
    if (!selectedCommit || !selectedFile || !commitDetail) {
      return;
    }

    const loadFileContent = async () => {
      setIsLoadingFileContent(true);
      try {
        const filePath = selectedFile.newPath || selectedFile.oldPath;
        const parentCommit =
          commitDetail.parentHashes && commitDetail.parentHashes.length > 0
            ? commitDetail.parentHashes[0]
            : null;

        // Fetch new content (at current commit)
        const newContentPromise =
          selectedFile.status !== 'D'
            ? GetFileContentAtCommit(selectedCommit.hash, filePath)
            : Promise.resolve('');

        // Fetch old content (at parent commit)
        const oldContentPromise =
          parentCommit && selectedFile.status !== 'A'
            ? GetFileContentAtCommit(parentCommit, selectedFile.oldPath || filePath)
            : Promise.resolve('');

        const [newContent, oldContent] = await Promise.all([newContentPromise, oldContentPromise]);

        setFileContent({ oldContent, newContent });
      } catch (error) {
        console.error('Failed to load file content:', error);
        setFileContent(null);
      } finally {
        setIsLoadingFileContent(false);
      }
    };

    loadFileContent();
  }, [selectedCommit, selectedFile, commitDetail]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !commitListRef.current) return;

      const containerRect = commitListRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = e.clientX - containerRect.left;
      const newPercent = (newWidth / containerRect.width) * 100;

      if (newPercent >= MIN_COMMIT_LIST_PERCENT && newPercent <= MAX_COMMIT_LIST_PERCENT) {
        setCommitListPercent(newPercent);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <History className="w-5 h-5" />
          Commit History
        </h1>
        <CommitSearch />
      </div>

      {/* Main content: commit list and detail panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Commit list with integrated graph */}
        <div
          ref={commitListRef}
          className="overflow-hidden border-r border-gray-200 dark:border-gray-700 flex-shrink-0 relative"
          style={{ width: selectedCommit ? `${commitListPercent}%` : '100%' }}
        >
          <CommitList />

          {/* Resize handle */}
          {selectedCommit && (
            <div
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors ${
                isResizing ? 'bg-blue-500' : 'bg-transparent'
              }`}
              onMouseDown={handleMouseDown}
              style={{ zIndex: 10 }}
            />
          )}
        </div>

        {/* Right: File tree panel */}
        {selectedCommit && (
          <div className="flex-1 overflow-hidden">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-gray-400">Loading commit details...</div>
              </div>
            ) : (
              <FileTreePanel
                commitDetail={commitDetail}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                repositoryName={currentRepository?.name}
              />
            )}
          </div>
        )}
      </div>

      {/* Diff Modal */}
      <DiffModal
        isOpen={!!selectedFile}
        onClose={handleCloseDiffModal}
        selectedFile={selectedFile}
        isLoading={isLoadingDetail || isLoadingFileContent}
        fileContent={fileContent}
        oldCommitHash={
          commitDetail?.parentHashes && commitDetail.parentHashes.length > 0
            ? commitDetail.parentHashes[0].slice(0, 7)
            : undefined
        }
        newCommitHash={selectedCommit?.hash.slice(0, 7)}
      />
    </div>
  );
}

export default HistoryView;
