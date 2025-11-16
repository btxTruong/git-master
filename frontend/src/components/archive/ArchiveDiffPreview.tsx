import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  AlertCircle,
  FileSearch,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getArchiveDiffContent } from '@/api/changelist';
import { VirtualizedUnifiedDiff } from '@/components/diff/VirtualizedUnifiedDiff';
import { VirtualizedSplitDiff } from '@/components/diff/VirtualizedSplitDiff';
import { EmptyState } from '@/components/common/EmptyState';
import { useUIStore } from '@/stores/uiStore';
import type { FileDiff } from '@/types/git';
import { FileStatus } from '@/types/git';

interface ArchiveDiffPreviewProps {
  archiveName: string | null;
  className?: string;
}

interface DiffCache {
  [archiveName: string]: {
    files: FileDiff[];
    rawContent: string;
    timestamp: number;
  };
}

const CACHE_TTL = 60000; // 60 seconds
const MAX_DIFF_SIZE_WARNING = 1048576; // 1MB

/**
 * Parse unified diff string into structured FileDiff objects
 */
function parseUnifiedDiff(diffContent: string): FileDiff[] {
  const files: FileDiff[] = [];
  const fileBlocks = diffContent.split(/(?=^diff --git )/m).filter(Boolean);

  for (const block of fileBlocks) {
    const lines = block.split('\n');
    let path = '';
    let oldPath = '';
    let status: FileStatus = FileStatus.Modified;
    let isBinary = false;
    const hunks: FileDiff['hunks'] = [];

    // Parse file header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.*?) b\/(.*)/);
        if (match) {
          oldPath = match[1];
          path = match[2];
        }
      } else if (line.startsWith('new file mode')) {
        status = FileStatus.Added;
      } else if (line.startsWith('deleted file mode')) {
        status = FileStatus.Deleted;
      } else if (line.startsWith('rename from')) {
        status = FileStatus.Renamed;
      } else if (line.includes('Binary files')) {
        isBinary = true;
        break;
      } else if (line.startsWith('@@')) {
        // Parse hunk
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (!match) continue;

        const oldStart = parseInt(match[1], 10);
        const oldLines = match[2] ? parseInt(match[2], 10) : 1;
        const newStart = parseInt(match[3], 10);
        const newLines = match[4] ? parseInt(match[4], 10) : 1;

        const hunkLines: FileDiff['hunks'][0]['lines'] = [];
        let oldLineNum = oldStart;
        let newLineNum = newStart;
        i++; // Move to next line after hunk header

        // Parse hunk lines
        while (
          i < lines.length &&
          !lines[i].startsWith('@@') &&
          !lines[i].startsWith('diff --git')
        ) {
          const hunkLine = lines[i];

          if (hunkLine.startsWith('+') && !hunkLine.startsWith('+++')) {
            hunkLines.push({
              type: 'add',
              content: hunkLine.substring(1),
              oldLineNumber: null,
              newLineNumber: newLineNum++,
            });
          } else if (hunkLine.startsWith('-') && !hunkLine.startsWith('---')) {
            hunkLines.push({
              type: 'delete',
              content: hunkLine.substring(1),
              oldLineNumber: oldLineNum++,
              newLineNumber: null,
            });
          } else if (hunkLine.startsWith(' ')) {
            hunkLines.push({
              type: 'context',
              content: hunkLine.substring(1),
              oldLineNumber: oldLineNum++,
              newLineNumber: newLineNum++,
            });
          }
          i++;
        }
        i--; // Backtrack one line for the outer loop

        hunks.push({
          oldStart,
          oldLines,
          newStart,
          newLines,
          header: line,
          lines: hunkLines,
          isCollapsed: false,
        });
      }
    }

    // Detect language from file extension
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      go: 'go',
      py: 'python',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
    };

    const additions = hunks.reduce(
      (sum, h) => sum + h.lines.filter((l) => l.type === 'add').length,
      0
    );
    const deletions = hunks.reduce(
      (sum, h) => sum + h.lines.filter((l) => l.type === 'delete').length,
      0
    );

    files.push({
      path,
      oldPath: oldPath || path,
      status,
      additions,
      deletions,
      hunks,
      isBinary,
      language: languageMap[ext] || 'text',
    });
  }

  return files;
}

/**
 * ArchiveDiffPreview component displays diff content from archived patches
 */
export function ArchiveDiffPreview({ archiveName, className = '' }: ArchiveDiffPreviewProps) {
  const [files, setFiles] = useState<FileDiff[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffSizeWarning, setDiffSizeWarning] = useState(false);
  const { diffViewMode } = useUIStore();

  // Cache for storing parsed diffs
  const cacheRef = useRef<DiffCache>({});

  // Fetch and parse archive diff
  const loadArchiveDiff = useCallback(async (name: string) => {
    // Check cache first
    const cached = cacheRef.current[name];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFiles(cached.files);
      setSelectedFileIndex(0);
      setError(null);
      setDiffSizeWarning(cached.rawContent.length > MAX_DIFF_SIZE_WARNING);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiffSizeWarning(false);

    try {
      const diffContent = await getArchiveDiffContent(name);

      // Check size warning
      if (diffContent.length > MAX_DIFF_SIZE_WARNING) {
        setDiffSizeWarning(true);
      }

      // Parse diff
      const parsedFiles = parseUnifiedDiff(diffContent);

      // Cache the result
      cacheRef.current[name] = {
        files: parsedFiles,
        rawContent: diffContent,
        timestamp: Date.now(),
      };

      setFiles(parsedFiles);
      setSelectedFileIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archive diff');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load diff when archiveName changes
  useEffect(() => {
    if (archiveName) {
      loadArchiveDiff(archiveName);
    } else {
      setFiles([]);
      setError(null);
      setSelectedFileIndex(0);
    }
  }, [archiveName, loadArchiveDiff]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading archive diff...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Failed to Load Diff
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
          {error}
        </p>
        {archiveName && (
          <button
            onClick={() => loadArchiveDiff(archiveName)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Empty state - no archive selected
  if (!archiveName) {
    return (
      <div className={`h-full bg-gray-50 dark:bg-gray-800 ${className}`}>
        <EmptyState
          icon={<FileSearch className="w-16 h-16" />}
          title="No Archive Selected"
          description="Select an archive from the list to view its diff here."
        />
      </div>
    );
  }

  // No files in archive
  if (files.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <FileSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Files</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This archive contains no diff content.
        </p>
      </div>
    );
  }

  const currentFile = files[selectedFileIndex];

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Size warning */}
      {diffSizeWarning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Large diff (
            {(cacheRef.current[archiveName]?.rawContent.length / 1024 / 1024).toFixed(2)} MB) -
            rendering may be slow
          </p>
        </div>
      )}

      {/* File navigation header */}
      {files.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFileIndex(Math.max(0, selectedFileIndex - 1))}
              disabled={selectedFileIndex === 0}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous file"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              File {selectedFileIndex + 1} of {files.length}
            </span>
            <button
              onClick={() =>
                setSelectedFileIndex(Math.min(files.length - 1, selectedFileIndex + 1))
              }
              disabled={selectedFileIndex === files.length - 1}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next file"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {files.reduce((sum, f) => sum + f.additions, 0)} additions,{' '}
            {files.reduce((sum, f) => sum + f.deletions, 0)} deletions
          </div>
        </div>
      )}

      {/* File header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {currentFile.path}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-green-600 dark:text-green-400">+{currentFile.additions}</span>
          <span className="text-red-600 dark:text-red-400">-{currentFile.deletions}</span>
          <span className="text-gray-500 dark:text-gray-400 capitalize">{currentFile.status}</span>
        </div>
      </div>

      {/* Diff viewer */}
      <div className="flex-1 overflow-hidden">
        {currentFile.isBinary ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FileSearch className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Binary File
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Binary file content cannot be displayed
            </p>
          </div>
        ) : currentFile.hunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FileSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Changes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No diff content for this file
            </p>
          </div>
        ) : diffViewMode === 'unified' ? (
          <VirtualizedUnifiedDiff fileDiff={currentFile} />
        ) : (
          <VirtualizedSplitDiff fileDiff={currentFile} />
        )}
      </div>
    </div>
  );
}
