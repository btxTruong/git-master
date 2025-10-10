# Create UI Zustand Store

## Type
feat

## Description
Create a Zustand store for managing UI-related state such as sidebar visibility, current view, diff view mode (unified/split), and theme preferences. Persist user preferences to localStorage.

## Acceptance Criteria
- [x] `stores/uiStore.ts` file created
- [x] Store includes: `sidebarOpen`, `currentView`, `diffViewMode`, `theme`
- [x] Actions implemented: `toggleSidebar`, `setView`, `setDiffViewMode`, `setTheme`
- [x] UI preferences persisted to localStorage
- [x] Default values are sensible (sidebar open, unified diff, system theme)
- [x] Store works independently of other stores
- [x] TypeScript types include enums for views and modes

## Technical Details
- **File to create**: `frontend/src/stores/uiStore.ts`

- **Implementation**:
  ```typescript
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
          if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0445-chore-create-project-folder-structure.md

## Notes
- All UI preferences are persisted to localStorage for consistency across sessions
- `currentView` is persisted so app reopens to last used view
- Theme setting applies dark mode class to `document.documentElement`
- System theme detection uses `window.matchMedia('(prefers-color-scheme: dark)')`
- Consider adding listener for system theme changes (future enhancement)
