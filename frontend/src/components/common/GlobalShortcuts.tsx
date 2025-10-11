import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut';
import { useRemoteStore } from '@/stores/remoteStore';
import { useUIStore } from '@/stores/uiStore';
import { useStagingStore } from '@/stores/stagingStore';
import { ShortcutsHelpDialog } from './ShortcutsHelpDialog';

/**
 * GlobalShortcuts component
 * Registers application-wide keyboard shortcuts
 *
 * Shortcuts:
 * - Cmd/Ctrl+K: Open commit dialog (if on changes view with staged files)
 * - Cmd/Ctrl+P: Pull changes from remote
 * - Cmd/Ctrl+Shift+P: Push changes to remote
 * - Cmd/Ctrl+B: Navigate to branches view
 * - Cmd/Ctrl+F: Focus search (if on history view)
 * - ?: Show shortcuts help dialog
 */
export function GlobalShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();
  const { pull, push } = useRemoteStore();
  const { currentView } = useUIStore();
  const { stagedFiles } = useStagingStore();

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      callback: () => {
        // Only trigger commit if we're on the changes view and have staged files
        if (currentView === 'changes' && stagedFiles.length > 0) {
          // This will need to be handled by the ChangesView component
          // For now, we'll dispatch a custom event that the ChangesView can listen to
          window.dispatchEvent(new CustomEvent('global-shortcut:commit'));
        }
      },
      description: 'Open commit dialog',
    },
    {
      key: 'p',
      ctrlKey: true,
      callback: async () => {
        try {
          await pull();
        } catch (error) {
          // Error is already handled in the store
          console.error('Pull failed:', error);
        }
      },
      description: 'Pull changes from remote',
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      callback: async () => {
        try {
          await push();
        } catch (error) {
          // Error is already handled in the store
          console.error('Push failed:', error);
        }
      },
      description: 'Push changes to remote',
    },
    {
      key: 'b',
      ctrlKey: true,
      callback: () => {
        navigate('/branches');
      },
      description: 'Navigate to branches view',
    },
    {
      key: 'f',
      ctrlKey: true,
      callback: () => {
        // Dispatch custom event for search focus
        // The HistoryView component will listen to this
        if (currentView === 'history') {
          window.dispatchEvent(new CustomEvent('global-shortcut:search'));
        }
      },
      description: 'Focus search',
    },
    {
      key: '?',
      callback: () => {
        setShowHelp(true);
      },
      description: 'Show shortcuts help',
      preventDefault: true,
    },
  ]);

  // Render the shortcuts help dialog
  return <ShortcutsHelpDialog isOpen={showHelp} onClose={() => setShowHelp(false)} />;
}
