import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'history' | 'changes' | 'branches' | 'merge' | 'settings';
export type DiffViewMode = 'unified' | 'split';
export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarOpen: boolean;
  currentView: ViewType;
  diffViewMode: DiffViewMode;
  theme: Theme;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setView: (view: ViewType) => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      currentView: 'history',
      diffViewMode: 'unified',
      theme: 'system',

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setView: (view) => {
        set({ currentView: view });
      },

      setDiffViewMode: (mode) => {
        set({ diffViewMode: mode });
      },

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'ui-preferences',
    }
  )
);
