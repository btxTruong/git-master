import { useMemo } from 'react';
import type { FileDiff } from '@/types/git';
import { VirtualizedUnifiedDiff } from './VirtualizedUnifiedDiff';

interface UnifiedDiffProps {
  fileDiff: FileDiff;
}

const VIRTUALIZATION_THRESHOLD = 1000;

export function UnifiedDiff({ fileDiff }: UnifiedDiffProps) {
  // Calculate total number of lines
  const totalLines = useMemo(() => {
    return fileDiff.hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0);
  }, [fileDiff.hunks]);

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
          <div className="bg-blue-50 text-blue-900 px-4 py-1 text-xs font-semibold border-b border-blue-100">
            {hunk.header}
          </div>

          {/* Lines */}
          <div className="lines">
            {hunk.lines.map((line, lineIndex) => {
              const lineType = line.type;
              const bgColor =
                lineType === 'add'
                  ? 'bg-green-50 hover:bg-green-100'
                  : lineType === 'delete'
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-white hover:bg-gray-50';
              const textColor =
                lineType === 'add'
                  ? 'text-green-900'
                  : lineType === 'delete'
                    ? 'text-red-900'
                    : 'text-gray-800';
              const prefix = lineType === 'add' ? '+' : lineType === 'delete' ? '-' : ' ';
              const prefixColor =
                lineType === 'add'
                  ? 'text-green-600'
                  : lineType === 'delete'
                    ? 'text-red-600'
                    : 'text-gray-400';

              return (
                <div key={lineIndex} className={`flex ${bgColor} ${textColor} transition-colors`}>
                  {/* Line numbers */}
                  <div className="w-20 flex-shrink-0 px-2 text-right text-xs text-gray-500 select-none border-r border-gray-200">
                    <span className="inline-block w-8">{line.oldLineNumber ?? ''}</span>
                    <span className="inline-block w-8 ml-1">{line.newLineNumber ?? ''}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-4 overflow-x-auto">
                    <span className={`inline-block w-4 font-bold ${prefixColor}`}>{prefix}</span>
                    <span className="whitespace-pre">{line.content}</span>
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
