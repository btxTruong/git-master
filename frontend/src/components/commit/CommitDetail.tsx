import { useEffect, useState } from 'react';
import { GetCommitDetail } from '../../../wailsjs/go/services/RepositoryService';
import { User, Calendar, GitCommit, FileText, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileChange {
  oldPath: string;
  newPath: string;
  status: string;
  insertions: number;
  deletions: number;
}

interface CommitDetailData {
  commit: {
    hash: string;
    shortHash: string;
    author: {
      name: string;
      email: string;
    };
    message: string;
    date: string;
  };
  files: FileChange[];
  diff: string;
}

interface CommitDetailProps {
  commitHash: string;
  onClose: () => void;
}

export function CommitDetail({ commitHash, onClose }: CommitDetailProps) {
  const [detail, setDetail] = useState<CommitDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitHash]);

  const loadDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GetCommitDetail(commitHash);
      setDetail(result as unknown as CommitDetailData);
      if (result.files && result.files.length > 0) {
        setSelectedFile(result.files[0].newPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commit detail');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A':
        return 'text-green-400';
      case 'M':
        return 'text-blue-400';
      case 'D':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'A':
        return 'Added';
      case 'M':
        return 'Modified';
      case 'D':
        return 'Deleted';
      case 'R':
        return 'Renamed';
      case 'C':
        return 'Copied';
      default:
        return 'Changed';
    }
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    // Map common extensions to Prism language names
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sh: 'bash',
    };
    return languageMap[ext || ''] || 'text';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading commit details...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-red-400">{error || 'Failed to load commit'}</div>
      </div>
    );
  }

  const totalInsertions = detail.files.reduce((sum, f) => sum + f.insertions, 0);
  const totalDeletions = detail.files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-sm text-gray-400">{detail.commit.shortHash}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-lg font-medium text-gray-200 mb-3">
          {detail.commit.message.split('\n')[0]}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{detail.commit.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(detail.commit.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">+{totalInsertions}</span>
            <span className="text-red-400">-{totalDeletions}</span>
          </div>
        </div>

        {detail.commit.message.split('\n').length > 1 && (
          <div className="mt-3 text-sm text-gray-300 whitespace-pre-wrap">
            {detail.commit.message.split('\n').slice(1).join('\n').trim()}
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="flex-shrink-0 bg-gray-850 border-b border-gray-700 p-3">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
          <FileText className="w-4 h-4" />
          <span>
            {detail.files.length} file{detail.files.length !== 1 ? 's' : ''} changed
          </span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {detail.files.map((file) => (
            <button
              key={file.newPath}
              onClick={() => setSelectedFile(file.newPath)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedFile === file.newPath
                  ? 'bg-gray-700 text-gray-200'
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono truncate">{file.newPath}</span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`text-xs ${getStatusColor(file.status)}`}>
                    {getStatusLabel(file.status)}
                  </span>
                  {file.insertions > 0 && (
                    <span className="text-xs text-green-400">+{file.insertions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className="text-xs text-red-400">-{file.deletions}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Diff View */}
      <div className="flex-1 overflow-auto bg-gray-900 p-4">
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <SyntaxHighlighter
            language={selectedFile ? getFileExtension(selectedFile) : 'diff'}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {detail.diff || 'No diff available'}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
