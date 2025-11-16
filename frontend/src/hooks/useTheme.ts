import { useEffect } from 'react';
import { useUIStore, type Theme } from '@/stores/uiStore';

/**
 * Hook to initialize and manage theme
 * Handles theme application and system preference changes
 */
export function useTheme() {
  const { theme, setTheme, loadPreferences, isLoaded } = useUIStore();

  useEffect(() => {
    // Load preferences from backend on initial mount
    if (!isLoaded) {
      loadPreferences();
    }
  }, [loadPreferences, isLoaded]);

  useEffect(() => {
    // Apply theme when it changes
    applyTheme(theme);

    // Listen for system theme changes when using 'system' theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}

/**
 * Apply theme to the document
 */
function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
