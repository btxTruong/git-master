import { useState } from 'react';
import { useStashStore } from '@/stores/stashStore';
import type { Stash } from '@/types/git';
import { Archive, Play, Download, Trash2, GitBranch, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StashItemProps {
  stash: Stash;
}

export function StashItem({ stash }: StashItemProps) {
  const { applyStash, popStash, dropStash, selectStash, selectedStash } = useStashStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const isSelected = selectedStash?.index === stash.index;

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      await applyStash(stash.index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePop = async () => {
    setIsProcessing(true);
    try {
      await popStash(stash.index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async () => {
    if (
      !confirm(`Drop stash@{${stash.index}}?\n"${stash.message}"\n\nThis action cannot be undone.`)
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      await dropStash(stash.index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    selectStash(isSelected ? null : stash);
  };

  return (
    <div
      className={`p-4 rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-900/30 border-2 border-blue-600'
          : 'bg-gray-800 hover:bg-gray-750 border-2 border-transparent'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Stash Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Archive
              className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}
            />
            <span className="text-sm font-mono text-gray-400">stash@{'{' + stash.index + '}'}</span>
          </div>

          <p className={`font-medium mb-2 ${isSelected ? 'text-blue-200' : 'text-gray-200'}`}>
            {stash.message}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              <span>{stash.branch}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(stash.date), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApply();
            }}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Apply stash (keeps it in the list)"
          >
            <Play className="w-3.5 h-3.5" />
            Apply
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePop();
            }}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Pop stash (applies and removes it)"
          >
            <Download className="w-3.5 h-3.5" />
            Pop
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDrop();
            }}
            disabled={isProcessing}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Drop stash (delete it)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
