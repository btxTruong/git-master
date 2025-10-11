import { useMemo } from 'react';
import type { FileDiff, DiffLine } from '@/types/git';
import { VirtualizedUnifiedDiff } from './VirtualizedUnifiedDiff';
import { computeInlineDiff, findMatchingLines, type InlineDiffSegment } from '@/utils/inlineDiff';

interface UnifiedDiffProps {
  fileDiff: FileDiff;
}

const VIRTUALIZATION_THRESHOLD = 1000;

export function UnifiedDiff({ fileDiff }: UnifiedDiffProps) {
  // Calculate total number of lines
  const totalLines = useMemo(() => {
    return fileDiff.hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0);
  }, [fileDiff.hunks]);

  // Compute inline diffs for adjacent delete/add line pairs
  const inlineDiffs = useMemo(() => {
    const diffs = new Map<
      string,
      { oldSegments?: InlineDiffSegment[]; newSegments?: InlineDiffSegment[] }
    >();

    fileDiff.hunks.forEach((hunk, hunkIndex) => {
      const deleteLines: Array<{ index: number; content: string; line: DiffLine }> = [];
      const addLines: Array<{ index: number; content: string; line: DiffLine }> = [];

      hunk.lines.forEach((line, lineIndex) => {
        if (line.type === 'delete') {
          deleteLines.push({ index: lineIndex, content: line.content, line });
        } else if (line.type === 'add') {
          addLines.push({ index: lineIndex, content: line.content, line });
        }
      });

      // Match up adjacent delete/add pairs
      const matches = findMatchingLines(deleteLines, addLines);

      matches.forEach((addIndex, deleteIndex) => {
        const deleteLine = hunk.lines[deleteIndex];
        const addLine = hunk.lines[addIndex];
        const { oldSegments, newSegments } = computeInlineDiff(deleteLine.content, addLine.content);

        diffs.set(`${hunkIndex}-${deleteIndex}`, { oldSegments });
        diffs.set(`${hunkIndex}-${addIndex}`, { newSegments });
      });
    });

    return diffs;
  }, [fileDiff.hunks]);

  const renderLineContent = (line: DiffLine, hunkIndex: number, lineIndex: number) => {
    const key = `${hunkIndex}-${lineIndex}`;
    const inlineDiff = inlineDiffs.get(key);

    if (inlineDiff?.oldSegments && line.type === 'delete') {
      return (
        <span className="whitespace-pre-wrap break-all">
          {inlineDiff.oldSegments.map((segment, i) => {
            if (segment.type === 'delete') {
              return (
                <span key={i} className="bg-red-300 dark:bg-red-800">
                  {segment.text}
                </span>
              );
            }
            return <span key={i}>{segment.text}</span>;
          })}
        </span>
      );
    }

    if (inlineDiff?.newSegments && line.type === 'add') {
      return (
        <span className="whitespace-pre-wrap break-all">
          {inlineDiff.newSegments.map((segment, i) => {
            if (segment.type === 'insert') {
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

  // Use virtualization for large diffs
  if (totalLines > VIRTUALIZATION_THRESHOLD) {
    return <VirtualizedUnifiedDiff fileDiff={fileDiff} />;
  }

  // Regular rendering for smaller diffs
  return (
    <div className="unified-diff font-mono text-sm">
      {fileDiff.hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="hunk">
          {/* Hunk header */}
          <div className="bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 px-4 py-1 text-xs font-semibold border-b border-blue-100 dark:border-blue-800">
            {hunk.header}
          </div>

          {/* Lines */}
          <div className="lines">
            {hunk.lines.map((line, lineIndex) => {
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
                <div key={lineIndex} className={`flex ${bgColor} ${textColor} transition-colors`}>
                  {/* Line numbers */}
                  <div className="w-20 flex-shrink-0 px-2 text-right text-xs text-gray-500 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">
                    <span className="inline-block w-8">{line.oldLineNumber ?? ''}</span>
                    <span className="inline-block w-8 ml-1">{line.newLineNumber ?? ''}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-4">
                    <span className={`inline-block w-4 font-bold ${prefixColor}`}>{prefix}</span>
                    {renderLineContent(line, hunkIndex, lineIndex)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
