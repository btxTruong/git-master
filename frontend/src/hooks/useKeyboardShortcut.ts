import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** The key code or key value (e.g., 'a', 'Enter', 'Escape') */
  key: string;
  /** Whether Ctrl key must be pressed */
  ctrlKey?: boolean;
  /** Whether Alt key must be pressed */
  altKey?: boolean;
  /** Whether Shift key must be pressed */
  shiftKey?: boolean;
  /** Whether Meta/Command key must be pressed */
  metaKey?: boolean;
  /** Callback function to execute when shortcut is triggered */
  callback: (event: KeyboardEvent) => void;
  /** Description of what the shortcut does */
  description?: string;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
}

/**
 * Options for the keyboard shortcut hook
 */
export interface UseKeyboardShortcutOptions {
  /** Whether the shortcut is enabled (default: true) */
  enabled?: boolean;
  /** Element to attach listener to (default: document) */
  target?: HTMLElement | Document | Window;
  /** Event type to listen for (default: 'keydown') */
  eventType?: 'keydown' | 'keyup' | 'keypress';
}

/**
 * Check if keyboard event matches the shortcut configuration
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifier keys
  if (!!shortcut.ctrlKey !== event.ctrlKey) return false;
  if (!!shortcut.altKey !== event.altKey) return false;
  if (!!shortcut.shiftKey !== event.shiftKey) return false;
  if (!!shortcut.metaKey !== event.metaKey) return false;

  return true;
}

/**
 * Custom React hook for registering keyboard shortcuts
 *
 * @param shortcut Keyboard shortcut configuration
 * @param options Hook options
 *
 * @example
 * ```tsx
 * // Simple shortcut
 * useKeyboardShortcut({
 *   key: 's',
 *   ctrlKey: true,
 *   callback: () => saveFile(),
 *   description: 'Save file'
 * });
 *
 * // With options
 * useKeyboardShortcut({
 *   key: 'Escape',
 *   callback: () => closeDialog(),
 *   preventDefault: true
 * }, {
 *   enabled: isDialogOpen,
 *   eventType: 'keyup'
 * });
 * ```
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  options: UseKeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    target = typeof document !== 'undefined' ? document : null,
    eventType = 'keydown',
  } = options;

  // Use ref to store callback to avoid re-registering listeners
  const callbackRef = useRef(shortcut.callback);
  callbackRef.current = shortcut.callback;

  const handleKeyEvent = useCallback(
    (event: KeyboardEvent) => {
      // Check if shortcut is enabled
      if (shortcut.enabled === false) return;

      // Check if event matches shortcut
      if (matchesShortcut(event, shortcut)) {
        // Prevent default and stop propagation if configured
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        // Execute callback
        callbackRef.current(event);
      }
    },
    [shortcut]
  );

  useEffect(() => {
    if (!enabled || !target) return;

    // Add event listener
    target.addEventListener(eventType, handleKeyEvent as EventListener);

    // Cleanup
    return () => {
      target.removeEventListener(eventType, handleKeyEvent as EventListener);
    };
  }, [enabled, target, eventType, handleKeyEvent]);
}

/**
 * Custom React hook for registering multiple keyboard shortcuts
 *
 * @param shortcuts Array of keyboard shortcut configurations
 * @param options Hook options
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrlKey: true,
 *     callback: () => saveFile(),
 *     description: 'Save file'
 *   },
 *   {
 *     key: 'o',
 *     ctrlKey: true,
 *     callback: () => openFile(),
 *     description: 'Open file'
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    target = typeof document !== 'undefined' ? document : null,
    eventType = 'keydown',
  } = options;

  // Use ref to store shortcuts to avoid re-registering listeners
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyEvent = useCallback((event: KeyboardEvent) => {
    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(
      (s) => s.enabled !== false && matchesShortcut(event, s)
    );

    if (matchingShortcut) {
      // Prevent default and stop propagation if configured
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      if (matchingShortcut.stopPropagation) {
        event.stopPropagation();
      }

      // Execute callback
      matchingShortcut.callback(event);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !target) return;

    // Add event listener
    target.addEventListener(eventType, handleKeyEvent as EventListener);

    // Cleanup
    return () => {
      target.removeEventListener(eventType, handleKeyEvent as EventListener);
    };
  }, [enabled, target, eventType, handleKeyEvent]);
}

/**
 * Format a keyboard shortcut for display
 *
 * @param shortcut Keyboard shortcut configuration
 * @returns Formatted string (e.g., "Ctrl+Shift+S")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Use Cmd on macOS, Ctrl elsewhere
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  if (shortcut.ctrlKey) {
    parts.push(isMac ? 'Cmd' : 'Ctrl');
  }
  if (shortcut.metaKey) {
    parts.push(isMac ? 'Cmd' : 'Meta');
  }
  if (shortcut.altKey) {
    parts.push(isMac ? 'Option' : 'Alt');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }

  // Capitalize key for display
  const displayKey = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  parts.push(displayKey);

  return parts.join('+');
}
