import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import type { ConflictFile } from '@/types/git';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { ConflictPane } from './ConflictPane';
import { useMergeStore } from '@/stores/mergeStore';

interface ConflictResolverProps {
  conflict: ConflictFile | null;
  onClose: () => void;
}

export function ConflictResolver({ conflict, onClose }: ConflictResolverProps) {
  const { resolveConflict, isLoading } = useMergeStore();
  const [resolution, setResolution] = useState<string>('');
  const [activePane, setActivePane] = useState<'base' | 'ours' | 'theirs' | 'result'>('result');

  if (!conflict) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-600">Select a conflicted file to resolve</p>
      </div>
    );
  }

  const handleAcceptOurs = async () => {
    if (!conflict) return;

    try {
      await resolveConflict(conflict.path, 'ours');
      onClose();
    } catch (error) {
      // Error is handled in the store
      console.error('Failed to accept ours:', error);
    }
  };

  const handleAcceptTheirs = async () => {
    if (!conflict) return;

    try {
      await resolveConflict(conflict.path, 'theirs');
      onClose();
    } catch (error) {
      // Error is handled in the store
      console.error('Failed to accept theirs:', error);
    }
  };

  const handleSaveCustom = async () => {
    if (!conflict || !resolution.trim()) return;

    try {
      await resolveConflict(conflict.path, 'custom', resolution);
      onClose();
    } catch (error) {
      // Error is handled in the store
      console.error('Failed to save custom resolution:', error);
    }
  };

  // Initialize resolution with 'ours' version if empty
  if (!resolution && conflict) {
    setResolution(conflict.ours);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Conflict Resolution</h2>
            <p className="text-sm text-gray-600 mt-1 font-mono">{conflict.path}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close conflict resolver"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAcceptOurs}
            disabled={isLoading}
            loading={isLoading}
          >
            Accept Ours
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAcceptTheirs}
            disabled={isLoading}
            loading={isLoading}
          >
            Accept Theirs
          </Button>
          <div className="flex-1" />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveCustom}
            disabled={isLoading || !resolution.trim()}
            loading={isLoading}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Save Resolution
          </Button>
        </div>
      </div>

      {/* Pane selector tabs */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActivePane('base')}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activePane === 'base'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Base (Common Ancestor)
          </button>
          <button
            onClick={() => setActivePane('ours')}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activePane === 'ours'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Ours (Current Branch)
          </button>
          <button
            onClick={() => setActivePane('theirs')}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activePane === 'theirs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Theirs (Incoming Branch)
          </button>
          <button
            onClick={() => setActivePane('result')}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${
                activePane === 'result'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Result (Editable)
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Resolving conflict...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Base pane */}
            {activePane === 'base' && (
              <ConflictPane
                title="Base (Common Ancestor)"
                content={conflict.base}
                readOnly
                helpText="This is the common ancestor version before the conflict"
              />
            )}

            {/* Ours pane */}
            {activePane === 'ours' && (
              <ConflictPane
                title="Ours (Current Branch)"
                content={conflict.ours}
                onAccept={handleAcceptOurs}
                helpText="This is your current branch version"
              />
            )}

            {/* Theirs pane */}
            {activePane === 'theirs' && (
              <ConflictPane
                title="Theirs (Incoming Branch)"
                content={conflict.theirs}
                onAccept={handleAcceptTheirs}
                helpText="This is the incoming branch version"
              />
            )}

            {/* Result pane (editable) */}
            {activePane === 'result' && (
              <ConflictPane
                title="Result (Editable)"
                content={resolution}
                onChange={setResolution}
                helpText="Edit this to create your final resolution. You can combine both versions or write custom content."
              />
            )}
          </>
        )}
      </div>

      {/* Footer with help text */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Tip:</span> Review the Base, Ours, and Theirs versions,
          then edit the Result pane to combine changes or create a custom resolution. Use{' '}
          <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">Ctrl+S</kbd> to save.
        </p>
      </div>
    </div>
  );
}
