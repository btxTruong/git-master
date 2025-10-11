import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'history' | 'changes' | 'branches' | 'merge' | 'settings';
export type DiffViewMode = 'unified' | 'split';
export type Theme = 'light' | 'dark' | 'system';
export type DateFormat = 'relative' | 'absolute' | 'both';

interface UIState {
  sidebarOpen: boolean;
  currentView: ViewType;
  diffViewMode: DiffViewMode;
  theme: Theme;

  // User preferences
  virtualizationThreshold: number; // Number of items before virtualization kicks in
  dateFormat: DateFormat;
  showLineNumbers: boolean;
  autoRefresh: boolean;
  commitLimit: number; // Number of commits to load per page

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setView: (view: ViewType) => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
  setTheme: (theme: Theme) => void;
  setVirtualizationThreshold: (threshold: number) => void;
  setDateFormat: (format: DateFormat) => void;
  setShowLineNumbers: (show: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setCommitLimit: (limit: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      currentView: 'history',
      diffViewMode: 'unified',
      theme: 'system',

      // Default preferences
      virtualizationThreshold: 100,
      dateFormat: 'relative',
      showLineNumbers: true,
      autoRefresh: true,
      commitLimit: 100,

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

      setVirtualizationThreshold: (threshold) => {
        set({ virtualizationThreshold: threshold });
      },

      setDateFormat: (format) => {
        set({ dateFormat: format });
      },

      setShowLineNumbers: (show) => {
        set({ showLineNumbers: show });
      },

      setAutoRefresh: (enabled) => {
        set({ autoRefresh: enabled });
      },

      setCommitLimit: (limit) => {
        set({ commitLimit: limit });
      },
    }),
    {
      name: 'ui-preferences',
    }
  )
);
