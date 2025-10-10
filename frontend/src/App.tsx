import { useState } from 'react';
import { useRepositoryStore } from './stores/repositoryStore';
import { OpenRepository } from '../wailsjs/go/services/RepositoryService';
import { FolderOpen, GitBranch, GitCommit } from 'lucide-react';
import { CommitList } from './components/commit/CommitList';

function App() {
  const { currentRepository, setRepository, setLoading, setError } = useRepositoryStore();
  const [isOpening, setIsOpening] = useState(false);

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
                <button className="w-full text-left px-3 py-2 rounded bg-gray-700 hover:bg-gray-600">
                  Commits
                </button>
                <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700">
                  Branches
                </button>
                <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700">
                  Changes
                </button>
                <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700">
                  Stashes
                </button>
              </nav>
            </aside>

            {/* Main Area */}
            <main className="flex-1 p-6">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold mb-4">Repository Overview</h2>
                <div className="bg-gray-800 rounded-lg p-6 space-y-3">
                  <div>
                    <span className="text-gray-400">Path:</span>
                    <span className="ml-2 font-mono text-sm">{currentRepository.path}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current Branch:</span>
                    <span className="ml-2 text-blue-400">{currentRepository.currentBranch}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="ml-2 text-green-400">Clean</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Recent Commits</h3>
                  <CommitList />
                </div>
              </div>
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
