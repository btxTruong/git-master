import { useState, useEffect, useCallback, useRef } from 'react';
import { FileSearch, AlertCircle, Loader2 } from 'lucide-react';
import { GetFileDiff } from '../../../wailsjs/go/services/StagingService';
import { FullFileSplitDiffViewer } from '@/components/diff/FullFileSplitDiffViewer';
import { EmptyState } from '@/components/common/EmptyState';
import type { StagingFileChange } from '@/types/git';

interface DiffPreviewPaneProps {
  selectedFile: StagingFileChange | null;
  className?: string;
}

interface FileContentCache {
  [key: string]: {
    oldContent: string;
    newContent: string;
    timestamp: number;
  };
}

const CACHE_TTL = 30000; // 30 seconds

/**
 * Displays diff preview for selected file from changelist using FullFileSplitDiffViewer.
 * Features:
 * - Lazy loads diff on file selection
 * - Caches file content for performance
 * - Shows loading, error, and empty states
 * - Handles binary files gracefully
 * - Uses the same split diff viewer as commit history
 */
export function DiffPreviewPane({ selectedFile, className = '' }: DiffPreviewPaneProps) {
  const [fileContent, setFileContent] = useState<{ oldContent: string; newContent: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for storing fetched file contents
  const cacheRef = useRef<FileContentCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key from file path and staged status
  const getCacheKey = useCallback((file: StagingFileChange): string => {
    return `${file.path}:${file.status}:${file.staged}`;
  }, []);

  // Clear cache (called when git status changes)
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // Parse unified diff to extract old and new content
  const parseUnifiedDiff = useCallback(
    (diffStr: string): { oldContent: string; newContent: string } => {
      const lines = diffStr.split('\n');
      const oldLines: string[] = [];
      const newLines: string[] = [];
      let inHunk = false;

      for (const line of lines) {
        // Skip diff headers
        if (
          line.startsWith('diff ') ||
          line.startsWith('index ') ||
          line.startsWith('new file mode') ||
          line.startsWith('deleted file mode') ||
          line.startsWith('---') ||
          line.startsWith('+++')
        ) {
          continue;
        }

        // Start of hunk
        if (line.startsWith('@@')) {
          inHunk = true;
          continue;
        }

        if (!inHunk) continue;

        if (line.startsWith('+')) {
          // Added line (only in new content)
          newLines.push(line.substring(1));
        } else if (line.startsWith('-')) {
          // Deleted line (only in old content)
          oldLines.push(line.substring(1));
        } else if (line.startsWith(' ')) {
          // Context line (in both old and new)
          const content = line.substring(1);
          oldLines.push(content);
          newLines.push(content);
        } else if (line.startsWith('\\')) {
          // "\ No newline at end of file" - skip
          continue;
        } else if (line.trim() === '') {
          // Empty line - treat as context
          oldLines.push('');
          newLines.push('');
        }
      }

      return {
        oldContent: oldLines.join('\n'),
        newContent: newLines.join('\n'),
      };
    },
    []
  );

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
        setFileContent({ oldContent: cached.oldContent, newContent: cached.newContent });
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Determine if we need staged or unstaged diff
        const isStaged = file.staged || false;
        const diffStr = await GetFileDiff(file.path, isStaged);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Check for binary file - only match at start of line to avoid false positives
        const lines = diffStr.split('\n');
        const isBinary = lines.some(
          (line) =>
            line.startsWith('Binary files') ||
            line.startsWith('GIT binary patch') ||
            line.trim() === 'Binary files differ'
        );
        if (isBinary) {
          setError('Binary file content cannot be displayed');
          setFileContent(null);
          return;
        }

        // Check for empty diff (no changes)
        if (!diffStr || diffStr.trim() === '') {
          setFileContent({ oldContent: '', newContent: '' });
          return;
        }

        // Parse diff to get old and new content
        const content = parseUnifiedDiff(diffStr);

        // If parsing resulted in empty content, it might be a parsing issue
        // Log for debugging (can be removed later)
        if (content.oldContent === '' && content.newContent === '') {
          console.warn('Diff parsing resulted in empty content for:', file.path);
          console.warn('Original diff:', diffStr);
        }

        setFileContent(content);

        // Cache the content
        cacheRef.current[cacheKey] = {
          oldContent: content.oldContent,
          newContent: content.newContent,
          timestamp: Date.now(),
        };
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load diff');
          setFileContent(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [getCacheKey, parseUnifiedDiff]
  );

  // Load diff when selected file changes
  useEffect(() => {
    if (selectedFile) {
      fetchDiff(selectedFile);
    } else {
      setFileContent(null);
      setError(null);
    }

    // Cleanup on unmount or file change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedFile, fetchDiff]);

  // Expose cache clearing function
  useEffect(() => {
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
          {error.includes('Binary') ? 'Binary File' : 'Failed to Load Diff'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
          {error}
        </p>
        {selectedFile && !error.includes('Binary') && (
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

  // No content state
  if (!fileContent || (fileContent.oldContent === '' && fileContent.newContent === '')) {
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

  // Render full file split diff viewer (same as commit history)
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* File header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {selectedFile.path}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 capitalize">{selectedFile.status}</span>
          {selectedFile.staged && (
            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-xs font-medium">
              Staged
            </span>
          )}
        </div>
      </div>

      {/* Full file split diff viewer */}
      <div className="flex-1 overflow-hidden">
        <FullFileSplitDiffViewer
          oldContent={fileContent.oldContent}
          newContent={fileContent.newContent}
          fileName={selectedFile.path}
          isLoading={false}
          oldCommitHash="Working Tree (Old)"
          newCommitHash="Working Tree (Current)"
        />
      </div>
    </div>
  );
}
