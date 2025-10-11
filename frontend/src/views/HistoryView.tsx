import { useEffect, useState } from 'react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { useCommitStore } from '@/stores/commitStore';
import { CommitList } from '@/components/commit/CommitList';
import { CommitGraph } from '@/components/commit/CommitGraph';
import { CommitSearch } from '@/components/commit/CommitSearch';
import { FileTreePanel } from '@/components/commit/FileTreePanel';
import { DiffModal } from '@/components/commit/DiffModal';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderOpen, History, GitBranch } from 'lucide-react';
import {
  GetCommitDetail,
  GetFileContentAtCommit,
} from '../../wailsjs/go/services/RepositoryService';
import type { models } from '../../wailsjs/go/models';

function HistoryView() {
  const { currentRepository } = useRepositoryStore();
  const { selectedCommit, loadCommits, reset } = useCommitStore();
  const [showGraph, setShowGraph] = useState(false);
  const [commitDetail, setCommitDetail] = useState<models.CommitDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<models.FileChange | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [fileContent, setFileContent] = useState<{ oldContent: string; newContent: string } | null>(
    null
  );
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);

  useEffect(() => {
    if (currentRepository) {
      loadCommits(0);
    } else {
      reset();
    }
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
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showGraph
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </button>
        </div>
        <CommitSearch />
      </div>

      {/* Main content: commit list and detail panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Commit list or graph */}
        <div
          className={`${selectedCommit ? 'w-1/2' : 'w-full'} overflow-hidden border-r border-gray-200 dark:border-gray-700`}
        >
          {showGraph ? <CommitGraph className="h-full" /> : <CommitList />}
        </div>

        {/* Right: File tree panel */}
        {selectedCommit && (
          <div className="w-1/2 overflow-hidden">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-gray-400">Loading commit details...</div>
              </div>
            ) : (
              <FileTreePanel
                commitDetail={commitDetail}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
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
      />
    </div>
  );
}

export default HistoryView;
