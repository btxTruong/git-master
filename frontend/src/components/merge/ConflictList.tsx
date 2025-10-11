import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { ConflictFile } from '@/types/git';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

interface ConflictListProps {
  conflicts: ConflictFile[];
  selectedConflict: ConflictFile | null;
  onSelectConflict: (conflict: ConflictFile) => void;
  isLoading?: boolean;
}

export function ConflictList({
  conflicts,
  selectedConflict,
  onSelectConflict,
  isLoading = false,
}: ConflictListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading conflicts...</p>
        </div>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-12 h-12 text-green-600" />}
        title="No Conflicts"
        description="All conflicts have been resolved or no conflicts were detected"
      />
    );
  }

  const unresolvedCount = conflicts.filter((c) => !c.resolved).length;
  const resolvedCount = conflicts.filter((c) => c.resolved).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Conflicted Files</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">{conflicts.length}</span>
              <span className="text-gray-600">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700">{resolvedCount}</span>
              <span className="text-gray-600">Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-700">{unresolvedCount}</span>
              <span className="text-gray-600">Unresolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {conflicts.map((conflict) => {
            const isSelected = selectedConflict?.path === conflict.path;
            const isResolved = conflict.resolved;

            return (
              <button
                key={conflict.path}
                onClick={() => onSelectConflict(conflict)}
                className={`
                  w-full text-left px-4 py-3 transition-colors
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                  ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}
                  ${isResolved ? 'opacity-75' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isResolved ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p
                          className={`font-mono text-sm truncate ${
                            isResolved ? 'text-green-900' : 'text-red-900'
                          }`}
                          title={conflict.path}
                        >
                          {conflict.path}
                        </p>
                      </div>

                      {/* File path directory */}
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {getDirectoryPath(conflict.path)}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded text-xs font-medium
                        ${isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      `}
                    >
                      {isResolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer with summary */}
      {unresolvedCount > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-yellow-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{unresolvedCount}</span>{' '}
              {unresolvedCount === 1 ? 'conflict' : 'conflicts'} remaining. Resolve all conflicts to
              complete the merge.
            </p>
          </div>
        </div>
      )}

      {unresolvedCount === 0 && resolvedCount > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-green-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              All conflicts resolved! You can now complete the merge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to extract directory path from file path
 */
function getDirectoryPath(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length === 1) {
    return 'Root directory';
  }
  return parts.slice(0, -1).join('/');
}
