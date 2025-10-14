import { Keyboard } from 'lucide-react';

interface ShortcutsHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl+B', description: 'Go to Branches view' },
      { keys: 'Ctrl+H', description: 'Go to History view' },
      { keys: 'Ctrl+C', description: 'Go to Changes view' },
      { keys: 'Arrow Up/Down', description: 'Navigate files and groups' },
    ],
  },
  {
    title: 'Git Operations',
    shortcuts: [
      { keys: 'Ctrl+K', description: 'Open commit dialog (when on Changes view)' },
      { keys: 'Ctrl+P', description: 'Pull changes from remote' },
      { keys: 'Ctrl+Shift+P', description: 'Push changes to remote' },
      { keys: 'Ctrl+R', description: 'Refresh current view' },
    ],
  },
  {
    title: 'Working Changes',
    shortcuts: [
      { keys: 'Ctrl+N', description: 'Create new group' },
      { keys: 'Ctrl+S', description: 'Commit selected group' },
      { keys: 'Ctrl+D', description: 'View diff for selected file' },
      { keys: 'Delete', description: 'Delete selected group' },
    ],
  },
  {
    title: 'Archives',
    shortcuts: [
      { keys: 'Ctrl+I', description: 'Import patch file' },
      { keys: 'Ctrl+D', description: 'View diff for selected archive' },
      { keys: 'Delete', description: 'Delete selected archive' },
    ],
  },
  {
    title: 'Search & Filter',
    shortcuts: [{ keys: 'Ctrl+F', description: 'Focus search (when on History view)' }],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: '?', description: 'Show this help dialog' },
      { keys: 'Esc', description: 'Close dialogs and modals' },
    ],
  },
];

/**
 * ShortcutsHelpDialog component
 * Displays all available keyboard shortcuts in the application
 */
export function ShortcutsHelpDialog({ isOpen, onClose }: ShortcutsHelpDialogProps) {
  if (!isOpen) {
    return null;
  }

  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  // Replace Ctrl with Cmd for macOS
  const formatKey = (key: string) => {
    if (isMac) {
      return key.replace(/Ctrl/g, 'Cmd');
    }
    return key;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <Keyboard className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
        </div>

        <div className="max-h-96 space-y-6 overflow-y-auto pr-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <kbd className="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">
                      {formatKey(shortcut.keys)
                        .split('+')
                        .map((key, i, arr) => (
                          <span key={i}>
                            {key}
                            {i < arr.length - 1 && <span className="mx-1 text-gray-400">+</span>}
                          </span>
                        ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500">
          Press{' '}
          <kbd className="inline-block rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs font-mono">
            ?
          </kbd>{' '}
          at any time to show this help
        </p>
      </div>
    </div>
  );
}
