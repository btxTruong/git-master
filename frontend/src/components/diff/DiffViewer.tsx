import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { UnifiedDiff } from './UnifiedDiff';
import { SplitDiff } from './SplitDiff';
import { FileDiffHeader } from './FileDiffHeader';
import type { DiffResult } from '@/types/git';

interface DiffViewerProps {
  diff: DiffResult | null;
  isLoading?: boolean;
}

const INITIAL_FILES_TO_RENDER = 3;
const FILES_INCREMENT = 3;

export function DiffViewer({ diff, isLoading }: DiffViewerProps) {
  const { diffViewMode } = useUIStore();
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [renderedFileCount, setRenderedFileCount] = useState(INITIAL_FILES_TO_RENDER);
  const prevDiffLengthRef = useRef<number>(0);

  const toggleFile = (path: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Reset rendered file count when diff changes
  const currentDiffLength = diff?.files.length ?? 0;
  if (prevDiffLengthRef.current !== currentDiffLength) {
    prevDiffLengthRef.current = currentDiffLength;
    if (renderedFileCount !== INITIAL_FILES_TO_RENDER) {
      setRenderedFileCount(INITIAL_FILES_TO_RENDER);
    }
  }

  // Progressive rendering: gradually increase rendered files
  useEffect(() => {
    if (!diff || renderedFileCount >= diff.files.length) {
      return;
    }

    const timer = setTimeout(() => {
      setRenderedFileCount((prev) => Math.min(prev + FILES_INCREMENT, diff.files.length));
    }, 100);
    return () => clearTimeout(timer);
  }, [renderedFileCount, diff]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-center text-gray-500">Loading diff...</div>
      </div>
    );
  }

  if (!diff || diff.files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-center text-gray-500">No changes</div>
      </div>
    );
  }

  // Get files to render (progressively)
  const filesToRender = diff.files.slice(0, renderedFileCount);
  const hasMoreFiles = renderedFileCount < diff.files.length;

  return (
    <div className="diff-viewer h-full overflow-auto">
      {filesToRender.map((fileDiff) => (
        <div key={fileDiff.path} className="border-b border-gray-200">
          <FileDiffHeader
            fileDiff={fileDiff}
            collapsed={collapsedFiles.has(fileDiff.path)}
            onToggle={() => toggleFile(fileDiff.path)}
          />

          {!collapsedFiles.has(fileDiff.path) && (
            <div className="bg-gray-50">
              {fileDiff.isBinary ? (
                <div className="p-4 text-sm text-gray-500">Binary file not shown</div>
              ) : diffViewMode === 'unified' ? (
                <UnifiedDiff fileDiff={fileDiff} />
              ) : (
                <SplitDiff fileDiff={fileDiff} />
              )}
            </div>
          )}
        </div>
      ))}

      {hasMoreFiles && (
        <div className="p-4 text-center text-gray-500 animate-pulse">Loading more files...</div>
      )}
    </div>
  );
}
