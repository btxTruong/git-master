import { useState } from 'react';
import { useStagingStore } from '@/stores/stagingStore';
import { FileTree } from './FileTree';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { GitCommit, FileCode } from 'lucide-react';

export function StagingArea() {
  const {
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
    selectedFile,
    isLoading,
    stageAll,
    unstageAll,
    setSelectedFile,
  } = useStagingStore();

  const [showCommitDialog, setShowCommitDialog] = useState(false);

  const totalChanges = stagedFiles.length + unstagedFiles.length + untrackedFiles.length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (totalChanges === 0) {
    return (
      <EmptyState
        icon={<GitCommit className="w-12 h-12" />}
        title="No changes"
        description="Your working directory is clean"
      />
    );
  }

  return (
    <div className="staging-area h-full flex flex-col">
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Left: File lists */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Staged */}
          <section className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Staged Changes ({stagedFiles.length})</h3>
              {stagedFiles.length > 0 && (
                <button
                  onClick={unstageAll}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Unstage All
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-auto">
              {stagedFiles.length > 0 ? (
                <FileTree
                  files={stagedFiles}
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500 text-center">No staged files</div>
              )}
            </div>
          </section>

          {/* Unstaged */}
          <section className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Unstaged Changes ({unstagedFiles.length})
              </h3>
              {unstagedFiles.length > 0 && (
                <button
                  onClick={stageAll}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Stage All
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-auto">
              {unstagedFiles.length > 0 ? (
                <FileTree
                  files={unstagedFiles}
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                />
              ) : (
                <div className="p-4 text-sm text-gray-500 text-center">No unstaged files</div>
              )}
            </div>
          </section>

          {/* Untracked */}
          {untrackedFiles.length > 0 && (
            <section className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Untracked Files ({untrackedFiles.length})
                </h3>
              </div>
              <div className="max-h-64 overflow-auto">
                <FileTree
                  files={untrackedFiles}
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                />
              </div>
            </section>
          )}

          {/* Commit button */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              disabled={stagedFiles.length === 0}
              onClick={() => setShowCommitDialog(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <GitCommit className="w-4 h-4" />
              Commit ({stagedFiles.length})
            </Button>
          </div>
        </div>

        {/* Right: Diff preview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  {selectedFile.path}
                </h3>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <div className="text-sm text-gray-500 text-center">Diff viewer coming soon...</div>
                {/* TODO: Replace with StagingDiff component when available */}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={<FileCode className="w-12 h-12" />}
                title="No file selected"
                description="Select a file to view its diff"
              />
            </div>
          )}
        </div>
      </div>

      {/* Commit dialog */}
      {showCommitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Commit Dialog</h3>
            <p className="text-sm text-gray-500">Coming soon...</p>
            {/* TODO: Replace with CommitDialog component when available */}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCommitDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
