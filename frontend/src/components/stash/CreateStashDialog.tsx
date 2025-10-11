import { useState } from 'react';
import { useStashStore } from '@/stores/stashStore';
import { X, Archive } from 'lucide-react';

interface CreateStashDialogProps {
  onClose: () => void;
}

export function CreateStashDialog({ onClose }: CreateStashDialogProps) {
  const { createStash } = useStashStore();
  const [message, setMessage] = useState('');
  const [includeUntracked, setIncludeUntracked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createStash(message.trim() || undefined, includeUntracked);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Create Stash</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Message (optional)</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="WIP: working on feature X"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty for default message</p>
      </div>

      {/* Include Untracked Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeUntracked"
          checked={includeUntracked}
          onChange={(e) => setIncludeUntracked(e.target.checked)}
          className="w-4 h-4 bg-gray-900 border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="includeUntracked" className="text-sm text-gray-300">
          Include untracked files
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Stash'}
        </button>
        <button
          onClick={onClose}
          disabled={isCreating}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-gray-500 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">⌘/Ctrl+Enter</kbd> to
        create
      </p>
    </div>
  );
}
