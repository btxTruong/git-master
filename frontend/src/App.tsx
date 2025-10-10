import { useState } from 'react';
import { useRepositoryStore } from './stores/repositoryStore';
import { OpenRepository } from '../wailsjs/go/services/RepositoryService';
import { FolderOpen, GitBranch, GitCommit } from 'lucide-react';
import { CommitList } from './components/commit/CommitList';
import { CommitDetail } from './components/commit/CommitDetail';
import { BranchList } from './components/branch/BranchList';

type View = 'commits' | 'branches' | 'changes' | 'stashes';

function App() {
  const { currentRepository, setRepository, setLoading, setError } = useRepositoryStore();
  const [isOpening, setIsOpening] = useState(false);
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('commits');

  const handleOpenRepository = async () => {
    setIsOpening(true);
    setLoading(true);

    try {
      // For now, we'll use a test path - later we'll add a directory picker
      const testPath = '/Users/truongbui/GolandProjects/git-master';
      const repo = await OpenRepository(testPath);
      setRepository(repo);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to open repository');
    } finally {
      setIsOpening(false);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold">Git Master</h1>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {currentRepository && (
            <div className="flex items-center gap-2 text-sm">
              <GitCommit className="w-4 h-4" />
              <span className="text-gray-400">{currentRepository.name}</span>
              <span className="text-blue-400">{currentRepository.currentBranch}</span>
            </div>
          )}
          <button
            onClick={handleOpenRepository}
            disabled={isOpening}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            {isOpening ? 'Opening...' : 'Open Repository'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {currentRepository ? (
          <>
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setCurrentView('commits')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentView === 'commits' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  Commits
                </button>
                <button
                  onClick={() => setCurrentView('branches')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentView === 'branches' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  Branches
                </button>
                <button
                  onClick={() => setCurrentView('changes')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentView === 'changes' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  Changes
                </button>
                <button
                  onClick={() => setCurrentView('stashes')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentView === 'stashes' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  Stashes
                </button>
              </nav>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex overflow-hidden">
              {currentView === 'commits' ? (
                <>
                  {/* Left: Commit List */}
                  <div className="w-1/2 border-r border-gray-700 flex flex-col">
                    <div className="flex-shrink-0 p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold">Commits</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <CommitList
                        onSelectCommit={setSelectedCommitHash}
                        selectedHash={selectedCommitHash || undefined}
                      />
                    </div>
                  </div>

                  {/* Right: Commit Detail */}
                  <div className="w-1/2 flex flex-col">
                    {selectedCommitHash ? (
                      <CommitDetail
                        commitHash={selectedCommitHash}
                        onClose={() => setSelectedCommitHash(null)}
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <GitCommit className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                          <p>Select a commit to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : currentView === 'branches' ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <BranchList />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</p>
                    <p className="text-sm">Coming soon...</p>
                  </div>
                </div>
              )}
            </main>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-semibold mb-2 text-gray-300">No Repository Open</h2>
              <p className="text-gray-500 mb-6">
                Open a Git repository to start managing your commits, branches, and more.
              </p>
              <button
                onClick={handleOpenRepository}
                disabled={isOpening}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
              >
                {isOpening ? 'Opening...' : 'Open Repository'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
