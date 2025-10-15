import { create } from 'zustand';
import { GetUIPreferences, SaveUIPreferences } from '../../wailsjs/go/services/AppConfigService';
import { services } from '../../wailsjs/go/models';

export type ViewType = 'history' | 'changes' | 'branches' | 'merge' | 'settings';
export type DiffViewMode = 'unified' | 'split';
export type Theme = 'light' | 'dark' | 'system';
export type DateFormat = 'relative' | 'absolute' | 'both';

interface UIState {
  sidebarOpen: boolean;
  currentView: ViewType;
  diffViewMode: DiffViewMode;
  theme: Theme;
  virtualizationThreshold: number;
  dateFormat: DateFormat;
  showLineNumbers: boolean;
  autoRefresh: boolean;
  commitLimit: number;
  isLoaded: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
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

const saveToBackend = async (state: Partial<services.UIPreferences>) => {
  try {
    const currentStore = useUIStore.getState();
    const prefs: services.UIPreferences = {
      sidebarOpen: state.sidebarOpen ?? currentStore.sidebarOpen,
      currentView: state.currentView ?? currentStore.currentView,
      diffViewMode: state.diffViewMode ?? currentStore.diffViewMode,
      theme: state.theme ?? currentStore.theme,
      virtualizationThreshold:
        state.virtualizationThreshold ?? currentStore.virtualizationThreshold,
      dateFormat: state.dateFormat ?? currentStore.dateFormat,
      showLineNumbers: state.showLineNumbers ?? currentStore.showLineNumbers,
      autoRefresh: state.autoRefresh ?? currentStore.autoRefresh,
      commitLimit: state.commitLimit ?? currentStore.commitLimit,
    };
    await SaveUIPreferences(prefs);
  } catch (error) {
    console.error('Failed to save UI preferences:', error);
  }
};

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  currentView: 'history',
  diffViewMode: 'unified',
  theme: 'system',
  virtualizationThreshold: 100,
  dateFormat: 'relative',
  showLineNumbers: true,
  autoRefresh: true,
  commitLimit: 100,
  isLoaded: false,

  loadPreferences: async () => {
    try {
      const prefs = await GetUIPreferences();
      if (prefs) {
        set({
          sidebarOpen: prefs.sidebarOpen,
          currentView: prefs.currentView as ViewType,
          diffViewMode: prefs.diffViewMode as DiffViewMode,
          theme: prefs.theme as Theme,
          virtualizationThreshold: prefs.virtualizationThreshold,
          dateFormat: prefs.dateFormat as DateFormat,
          showLineNumbers: prefs.showLineNumbers,
          autoRefresh: prefs.autoRefresh,
          commitLimit: prefs.commitLimit,
          isLoaded: true,
        });

        // Apply theme to document
        const theme = prefs.theme as Theme;
        if (
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Failed to load UI preferences:', error);
      set({ isLoaded: true });
    }
  },

  toggleSidebar: () => {
    const newValue = !get().sidebarOpen;
    set({ sidebarOpen: newValue });
    saveToBackend({ sidebarOpen: newValue });
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
    saveToBackend({ sidebarOpen: open });
  },

  setView: (view) => {
    set({ currentView: view });
    saveToBackend({ currentView: view });
  },

  setDiffViewMode: (mode) => {
    set({ diffViewMode: mode });
    saveToBackend({ diffViewMode: mode });
  },

  setTheme: (theme) => {
    set({ theme });
    saveToBackend({ theme });

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
    saveToBackend({ virtualizationThreshold: threshold });
  },

  setDateFormat: (format) => {
    set({ dateFormat: format });
    saveToBackend({ dateFormat: format });
  },

  setShowLineNumbers: (show) => {
    set({ showLineNumbers: show });
    saveToBackend({ showLineNumbers: show });
  },

  setAutoRefresh: (enabled) => {
    set({ autoRefresh: enabled });
    saveToBackend({ autoRefresh: enabled });
  },

  setCommitLimit: (limit) => {
    set({ commitLimit: limit });
    saveToBackend({ commitLimit: limit });
  },
}));
