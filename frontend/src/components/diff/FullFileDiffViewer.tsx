import { useMemo } from 'react';
import { computeInlineDiff, type InlineDiffSegment } from '@/utils/inlineDiff';

interface FullFileDiffViewerProps {
  oldContent: string;
  newContent: string;
  isLoading?: boolean;
}

interface DiffLine {
  type: 'add' | 'delete' | 'context';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
  segments?: InlineDiffSegment[];
}

export function FullFileDiffViewer({ oldContent, newContent, isLoading }: FullFileDiffViewerProps) {
  const lines = useMemo(() => {
    if (!oldContent && !newContent) {
      return [];
    }

    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    // Simple line-by-line diff
    const result: DiffLine[] = [];
    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldIndex < oldLines.length ? oldLines[oldIndex] : null;
      const newLine = newIndex < newLines.length ? newLines[newIndex] : null;

      if (oldLine === newLine && oldLine !== null) {
        // Context line (unchanged)
        result.push({
          type: 'context',
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1,
          content: oldLine,
        });
        oldIndex++;
        newIndex++;
      } else if (oldLine !== null && newLine !== null) {
        // Changed line - compute inline diff
        const { oldSegments, newSegments } = computeInlineDiff(oldLine, newLine);

        result.push({
          type: 'delete',
          oldLineNumber: oldIndex + 1,
          newLineNumber: null,
          content: oldLine,
          segments: oldSegments,
        });

        result.push({
          type: 'add',
          oldLineNumber: null,
          newLineNumber: newIndex + 1,
          content: newLine,
          segments: newSegments,
        });

        oldIndex++;
        newIndex++;
      } else if (oldLine !== null) {
        // Deleted line
        result.push({
          type: 'delete',
          oldLineNumber: oldIndex + 1,
          newLineNumber: null,
          content: oldLine,
        });
        oldIndex++;
      } else if (newLine !== null) {
        // Added line
        result.push({
          type: 'add',
          oldLineNumber: null,
          newLineNumber: newIndex + 1,
          content: newLine,
        });
        newIndex++;
      }
    }

    return result;
  }, [oldContent, newContent]);

  const renderLineContent = (line: DiffLine) => {
    if (line.segments) {
      return (
        <span className="whitespace-pre-wrap break-all">
          {line.segments.map((segment, i) => {
            if (segment.type === 'delete' && line.type === 'delete') {
              return (
                <span key={i} className="bg-red-300 dark:bg-red-800">
                  {segment.text}
                </span>
              );
            }
            if (segment.type === 'insert' && line.type === 'add') {
              return (
                <span key={i} className="bg-green-300 dark:bg-green-800">
                  {segment.text}
                </span>
              );
            }
            return <span key={i}>{segment.text}</span>;
          })}
        </span>
      );
    }

    return <span className="whitespace-pre-wrap break-all">{line.content}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading full file...</div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">No content</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="unified-diff font-mono text-sm">
        {lines.map((line, index) => {
          const lineType = line.type;
          const bgColor =
            lineType === 'add'
              ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
              : lineType === 'delete'
                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
          const textColor =
            lineType === 'add'
              ? 'text-green-900 dark:text-green-100'
              : lineType === 'delete'
                ? 'text-red-900 dark:text-red-100'
                : 'text-gray-800 dark:text-gray-200';
          const prefix = lineType === 'add' ? '+' : lineType === 'delete' ? '-' : ' ';
          const prefixColor =
            lineType === 'add'
              ? 'text-green-600 dark:text-green-400'
              : lineType === 'delete'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-400 dark:text-gray-600';

          return (
            <div key={index} className={`flex ${bgColor} ${textColor} transition-colors`}>
              {/* Line numbers */}
              <div className="w-20 flex-shrink-0 px-2 text-right text-xs text-gray-500 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">
                <span className="inline-block w-8">{line.oldLineNumber ?? ''}</span>
                <span className="inline-block w-8 ml-1">{line.newLineNumber ?? ''}</span>
              </div>

              {/* Content */}
              <div className="flex-1 px-4 py-0.5">
                <span className={`inline-block w-4 font-bold ${prefixColor}`}>{prefix}</span>
                {renderLineContent(line)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
