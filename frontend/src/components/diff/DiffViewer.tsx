import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { UnifiedDiff } from './UnifiedDiff';
import { SplitDiff } from './SplitDiff';
import type { DiffResult, FileDiff } from '@/types/git';

// Placeholder components - to be implemented in subsequent tasks

const FileDiffHeader = ({
  fileDiff,
  collapsed,
  onToggle,
}: {
  fileDiff: FileDiff;
  collapsed: boolean;
  onToggle: () => void;
}) => (
  <div
    className="p-3 bg-gray-100 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
    onClick={onToggle}
  >
    <div className="flex items-center justify-between">
      <div className="font-mono text-sm font-medium">{fileDiff.path}</div>
      <div className="text-xs text-gray-600">
        <span className="text-green-600">+{fileDiff.additions}</span>
        {' / '}
        <span className="text-red-600">-{fileDiff.deletions}</span>
        <span className="ml-2">{collapsed ? '▶' : '▼'}</span>
      </div>
    </div>
  </div>
);

interface DiffViewerProps {
  diff: DiffResult | null;
  isLoading?: boolean;
}

export function DiffViewer({ diff, isLoading }: DiffViewerProps) {
  const { diffViewMode } = useUIStore();
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

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

  return (
    <div className="diff-viewer h-full overflow-auto">
      {diff.files.map((fileDiff) => (
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
    </div>
  );
}
