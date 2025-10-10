# Create App Header Component

## Type
feat

## Description
Create the application header component that displays the repository name, current branch, and action buttons (open repository, recent repositories dropdown). This is a persistent header visible across all views.

## Acceptance Criteria
- [x] `components/layout/AppHeader.tsx` component created
- [x] Displays repository name and current branch from repository store
- [x] Shows "No repository open" when no repo is loaded
- [x] "Open Repository" button triggers file dialog (via Wails)
- [ ] Recent repositories dropdown shows last 10 repos - Future enhancement
- [ ] Clicking recent repo opens it - Future enhancement
- [x] Header is responsive and fixed at top
- [x] Branch indicator shows detached HEAD state if applicable
- [x] Component uses Tailwind for styling
- [x] No type errors exist
- [x] No linting errors exist

## Technical Details
- **File to create**: `frontend/src/components/layout/AppHeader.tsx`

- **Implementation**:
  ```typescript
  import { Menu } from '@headlessui/react';
  import { FolderOpen, GitBranch, ChevronDown } from 'lucide-react';
  import { useRepositoryStore } from '@/stores/repositoryStore';
  import { SelectDirectory } from '../../../wailsjs/runtime';

  export function AppHeader() {
    const { currentRepo, recentRepos, openRepository } = useRepositoryStore();

    const handleOpenRepo = async () => {
      try {
        const path = await SelectDirectory();
        if (path) {
          await openRepository(path);
        }
      } catch (error) {
        console.error('Failed to open repository:', error);
      }
    };

    return (
      <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
        {/* Left: Repository info */}
        <div className="flex items-center gap-4">
          {currentRepo ? (
            <>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {currentRepo.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GitBranch className="w-4 h-4" />
                <span>
                  {currentRepo.isDetached
                    ? `HEAD detached at ${currentRepo.currentBranch.slice(0, 7)}`
                    : currentRepo.currentBranch
                  }
                </span>
              </div>
            </>
          ) : (
            <span className="text-gray-500">No repository open</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenRepo}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            Open Repository
          </button>

          {recentRepos.length > 0 && (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
                Recent
                <ChevronDown className="w-4 h-4" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg">
                {recentRepos.map((repo) => (
                  <Menu.Item key={repo.path}>
                    {({ active }) => (
                      <button
                        onClick={() => openRepository(repo.path)}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          active ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="font-medium">{repo.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {repo.path}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          )}
        </div>
      </header>
    );
  }
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0600-feat-create-repository-store.md

## Notes
- Use Headless UI `Menu` for recent repositories dropdown
- `SelectDirectory` is a Wails runtime function for native file picker
- Header height should be fixed (e.g., `h-14`) for layout consistency
- Consider adding loading spinner when opening repository
- Detached HEAD state should be clearly indicated
