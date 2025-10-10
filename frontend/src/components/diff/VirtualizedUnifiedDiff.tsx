import { useRef, useMemo, type CSSProperties } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FileDiff, DiffLine } from '@/types/git';

interface VirtualizedUnifiedDiffProps {
  fileDiff: FileDiff;
}

interface FlatDiffItem {
  type: 'hunk-header' | 'line';
  hunkIndex?: number;
  lineIndex?: number;
  hunkHeader?: string;
  line?: DiffLine;
}

export function VirtualizedUnifiedDiff({ fileDiff }: VirtualizedUnifiedDiffProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten hunks and lines into a single array for virtualization
  const flatItems = useMemo<FlatDiffItem[]>(() => {
    const items: FlatDiffItem[] = [];
    fileDiff.hunks.forEach((hunk, hunkIndex) => {
      // Add hunk header
      items.push({
        type: 'hunk-header',
        hunkIndex,
        hunkHeader: hunk.header,
      });
      // Add lines
      hunk.lines.forEach((line, lineIndex) => {
        items.push({
          type: 'line',
          hunkIndex,
          lineIndex,
          line,
        });
      });
    });
    return items;
  }, [fileDiff.hunks]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Line height in pixels
    overscan: 20, // Render 20 extra items above and below viewport
  });

  const renderItem = (item: FlatDiffItem, style: CSSProperties) => {
    if (item.type === 'hunk-header') {
      return (
        <div
          style={style}
          className="bg-blue-50 text-blue-900 px-4 py-1 text-xs font-semibold border-b border-blue-100 font-mono"
        >
          {item.hunkHeader}
        </div>
      );
    }

    // Render line
    const line = item.line!;
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
      <div style={style} className={`flex ${bgColor} ${textColor} transition-colors font-mono`}>
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
  };

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(
                item,
                {} // style is handled by the outer div
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
