import { useState, useEffect, useCallback, useRef } from 'react';
import { FileSearch, AlertCircle, Loader2 } from 'lucide-react';
import { GetFileDiff } from '@/../../wailsjs/go/services/StagingService';
import { VirtualizedUnifiedDiff } from '@/components/diff/VirtualizedUnifiedDiff';
import { VirtualizedSplitDiff } from '@/components/diff/VirtualizedSplitDiff';
import { EmptyState } from '@/components/common/EmptyState';
import { useUIStore } from '@/stores/uiStore';
import type { StagingFileChange } from '@/types/git';
import type { FileDiff } from '@/types/git';

interface DiffPreviewPaneProps {
  selectedFile: StagingFileChange | null;
  className?: string;
}

interface DiffCache {
  [key: string]: {
    diff: FileDiff;
    timestamp: number;
  };
}

const CACHE_TTL = 30000; // 30 seconds

/**
 * Displays diff preview for selected file from changelist.
 * Features:
 * - Lazy loads diff on file selection
 * - Caches diffs for performance
 * - Shows loading, error, and empty states
 * - Handles binary files gracefully
 * - Reuses existing virtualized diff viewers
 */
export function DiffPreviewPane({ selectedFile, className = '' }: DiffPreviewPaneProps) {
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { diffViewMode } = useUIStore();

  // Cache for storing fetched diffs
  const cacheRef = useRef<DiffCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key from file path and staged status
  const getCacheKey = useCallback((file: StagingFileChange): string => {
    return `${file.path}:${file.status}`;
  }, []);

  // Clear cache (called when git status changes)
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // Parse diff string into FileDiff object
  const parseDiff = useCallback((diffStr: string, file: StagingFileChange): FileDiff => {
    const lines = diffStr.split('\n');
    const hunks: Array<{
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      header: string;
      lines: Array<{
        type: 'add' | 'delete' | 'context';
        content: string;
        oldLineNumber: number | null;
        newLineNumber: number | null;
      }>;
      isCollapsed: boolean;
    }> = [];

    let currentHunk: (typeof hunks)[0] | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      if (line.startsWith('@@')) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        // Parse line numbers from hunk header
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        let oldStart = 0;
        let oldLines = 0;
        let newStart = 0;
        let newLines = 0;

        if (match) {
          oldStart = parseInt(match[1], 10);
          oldLines = match[2] ? parseInt(match[2], 10) : 1;
          newStart = parseInt(match[3], 10);
          newLines = match[4] ? parseInt(match[4], 10) : 1;
          oldLineNum = oldStart;
          newLineNum = newStart;
        }

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          header: line,
          lines: [],
          isCollapsed: false,
        };
        continue;
      }

      if (!currentHunk) continue;

      // Parse diff lines
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.lines.push({
          type: 'add',
          content: line.substring(1),
          oldLineNumber: null,
          newLineNumber: newLineNum++,
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.lines.push({
          type: 'delete',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          newLineNumber: null,
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    // Detect language from file extension
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
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

    return {
      path: file.path,
      oldPath: file.path,
      status: file.status,
      additions: hunks.reduce((sum, h) => sum + h.lines.filter((l) => l.type === 'add').length, 0),
      deletions: hunks.reduce(
        (sum, h) => sum + h.lines.filter((l) => l.type === 'delete').length,
        0
      ),
      hunks,
      isBinary: false,
      language: languageMap[ext] || 'text',
    };
  }, []);

  // Fetch diff for selected file
  const fetchDiff = useCallback(
    async (file: StagingFileChange) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const cacheKey = getCacheKey(file);

      // Check cache first
      const cached = cacheRef.current[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setDiff(cached.diff);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Determine if we need staged or unstaged diff based on the 'staged' property
        const isStaged = file.staged;
        const diffStr = await GetFileDiff(file.path, isStaged);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Check for binary file
        if (diffStr.includes('Binary files') || diffStr.includes('GIT binary patch')) {
          const binaryDiff: FileDiff = {
            path: file.path,
            oldPath: file.path,
            status: file.status,
            additions: 0,
            deletions: 0,
            hunks: [],
            isBinary: true,
            language: 'binary',
          };
          setDiff(binaryDiff);
          cacheRef.current[cacheKey] = {
            diff: binaryDiff,
            timestamp: Date.now(),
          };
        } else {
          const parsedDiff = parseDiff(diffStr, file);
          setDiff(parsedDiff);
          cacheRef.current[cacheKey] = {
            diff: parsedDiff,
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load diff');
          setDiff(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [getCacheKey, parseDiff]
  );

  // Load diff when selected file changes
  useEffect(() => {
    if (selectedFile) {
      fetchDiff(selectedFile);
    } else {
      setDiff(null);
      setError(null);
    }

    // Cleanup on unmount or file change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedFile, fetchDiff]);

  // Expose cache clearing function (can be called from parent)
  useEffect(() => {
    // Clear cache when component unmounts or repository changes
    return () => {
      clearCache();
    };
  }, [clearCache]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading diff...</p>
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
        {selectedFile && (
          <button
            onClick={() => fetchDiff(selectedFile)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Empty state - no file selected
  if (!selectedFile) {
    return (
      <div className={`h-full bg-gray-50 dark:bg-gray-800 ${className}`}>
        <EmptyState
          icon={<FileSearch className="w-16 h-16" />}
          title="No File Selected"
          description="Select a file from any changelist group to view its diff here."
        />
      </div>
    );
  }

  // Binary file state
  if (diff?.isBinary) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <FileSearch className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Binary File</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
          {selectedFile.path}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Binary file content cannot be displayed
        </p>
      </div>
    );
  }

  // Render diff viewer
  if (!diff || diff.hunks.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        <FileSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Changes</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No diff available for {selectedFile.path}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* File header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {diff.path}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-green-600 dark:text-green-400">+{diff.additions}</span>
          <span className="text-red-600 dark:text-red-400">-{diff.deletions}</span>
          <span className="text-gray-500 dark:text-gray-400 capitalize">{diff.status}</span>
        </div>
      </div>

      {/* Diff viewer */}
      <div className="flex-1 overflow-hidden">
        {diffViewMode === 'unified' ? (
          <VirtualizedUnifiedDiff fileDiff={diff} />
        ) : (
          <VirtualizedSplitDiff fileDiff={diff} />
        )}
      </div>
    </div>
  );
}
