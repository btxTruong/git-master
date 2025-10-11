import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { ConflictFile } from '@/types/git';

interface MergeActionsProps {
  conflicts: ConflictFile[];
  currentConflictIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onMarkResolved?: (conflict: ConflictFile) => void;
  isLoading?: boolean;
}

export function MergeActions({
  conflicts,
  currentConflictIndex,
  onPrevious,
  onNext,
  onMarkResolved,
  isLoading = false,
}: MergeActionsProps) {
  const currentConflict = conflicts[currentConflictIndex];
  const hasPrevious = currentConflictIndex > 0;
  const hasNext = currentConflictIndex < conflicts.length - 1;
  const unresolvedCount = conflicts.filter((c) => !c.resolved).length;

  if (!currentConflict) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <div className="text-sm text-gray-600">
          Conflict <span className="font-semibold text-gray-900">{currentConflictIndex + 1}</span>{' '}
          of <span className="font-semibold text-gray-900">{conflicts.length}</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || isLoading}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        {/* Unresolved count */}
        {unresolvedCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-gray-700">
              <span className="font-semibold text-yellow-700">{unresolvedCount}</span> unresolved
            </span>
          </div>
        )}

        {/* Mark as resolved button */}
        {onMarkResolved && !currentConflict.resolved && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMarkResolved(currentConflict)}
            disabled={isLoading}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Mark as Resolved
          </Button>
        )}

        {/* Already resolved indicator */}
        {currentConflict.resolved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 font-medium">Resolved</span>
          </div>
        )}
      </div>
    </div>
  );
}
