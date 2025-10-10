# Implement Open Repository Dialog

## Type
feat

## Description
Create the OpenRepoDialog component that allows users to select a Git repository folder using Wails' native directory picker. The dialog calls the repository store to open and validate the selected repository.

## Acceptance Criteria
- [ ] `components/repository/OpenRepoDialog.tsx` created
- [ ] Uses Wails `window.OpenDirectoryDialog()` for folder selection
- [ ] Calls `repositoryStore.openRepository()` with selected path
- [ ] Shows loading state while opening repository
- [ ] Displays error toast on failure
- [ ] Closes dialog automatically on success
- [ ] Dialog can be opened from AppHeader component
- [ ] Recent repositories list updates after opening

## Technical Details

**File to create**: `frontend/src/components/repository/OpenRepoDialog.tsx`

**Implementation**:
```typescript
import { useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useRepositoryStore } from '@/stores/repositoryStore';
import { Button } from '@/components/common/Button';

interface OpenRepoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenRepoDialog({ isOpen, onClose }: OpenRepoDialogProps) {
  const [isOpening, setIsOpening] = useState(false);
  const { openRepository } = useRepositoryStore();

  const handleSelectFolder = async () => {
    try {
      setIsOpening(true);

      // Use Wails native directory picker
      const result = await window.runtime.OpenDirectoryDialog({
        title: 'Select Git Repository',
      });

      // User cancelled
      if (!result) {
        setIsOpening(false);
        return;
      }

      // Open repository
      await openRepository(result);

      // Success - close dialog
      onClose();
    } catch (error) {
      console.error('Failed to open repository:', error);
      // Error toast is shown by the store
    } finally {
      setIsOpening(false);
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

        <p className="text-gray-600 mb-6">
          Select a folder containing a Git repository to open.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isOpening}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSelectFolder}
            disabled={isOpening}
          >
            {isOpening ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 mr-2" />
                Select Folder
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Integrate in AppHeader**:
```typescript
// Update AppHeader.tsx
import { useState } from 'react';
import { OpenRepoDialog } from '@/components/repository/OpenRepoDialog';

export function AppHeader() {
  const [showOpenDialog, setShowOpenDialog] = useState(false);

  // ... existing code

  return (
    <>
      <header>
        {/* ... */}
        <Button onClick={() => setShowOpenDialog(true)}>
          Open Repository
        </Button>
      </header>

      <OpenRepoDialog
        isOpen={showOpenDialog}
        onClose={() => setShowOpenDialog(false)}
      />
    </>
  );
}
```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0600-feat-create-repository-store.md
- Depends on: 2025-10-11-0645-feat-create-app-header-component.md
- Depends on: 2025-10-11-0800-feat-create-button-component.md

## Notes
- Wails runtime is available at `window.runtime`
- OpenDirectoryDialog returns the selected path or empty string if cancelled
- Error handling is done in the repository store
- Dialog uses fixed positioning with backdrop
- Loading state prevents multiple concurrent open operations
