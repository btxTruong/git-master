import { useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { Button } from '@/components/common/Button';
import { OpenDirectoryDialog } from '../../../wailsjs/go/main/App';
import { OpenRepository } from '../../../wailsjs/go/services/RepositoryService';

interface OpenRepoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenRepoDialog({ isOpen, onClose }: OpenRepoDialogProps) {
  const [isOpening, setIsOpening] = useState(false);
  const setRepository = useRepositoryStore((state) => state.setRepository);
  const setError = useRepositoryStore((state) => state.setError);
  const setLoading = useRepositoryStore((state) => state.setLoading);

  const handleSelectFolder = async () => {
    try {
      setIsOpening(true);
      setLoading(true);

      // Use Wails native directory picker
      const selectedPath = await OpenDirectoryDialog();

      // User cancelled
      if (!selectedPath) {
        setIsOpening(false);
        setLoading(false);
        return;
      }

      // Open repository via backend and get repository info
      // @ts-expect-error - Zustand type inference issue with models.Repository
      const repo = await OpenRepository(selectedPath);
      setRepository(repo);

      // Success - close dialog
      onClose();
    } catch (error) {
      console.error('Failed to open repository:', error);
      setError(`Failed to open repository: ${error}`);
    } finally {
      setIsOpening(false);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Open Repository
        </h2>

        <p className="text-gray-600 mb-6">Select a folder containing a Git repository to open.</p>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isOpening}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSelectFolder}
            disabled={isOpening}
            leftIcon={
              isOpening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )
            }
          >
            {isOpening ? 'Opening...' : 'Select Folder'}
          </Button>
        </div>
      </div>
    </div>
  );
}
