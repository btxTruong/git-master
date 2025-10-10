# Create Sidebar Navigation Component

## Type
feat

## Description
Create a collapsible sidebar navigation component with links to main views (History, Changes, Branches, Merge, Settings). Sidebar state is controlled by the UI store and persists across sessions.

## Acceptance Criteria
- [x] `components/layout/Sidebar.tsx` component created
- [x] Navigation links for: History, Changes, Branches, Merge, Settings
- [x] Active view is visually highlighted
- [x] Icons from Lucide React for each navigation item
- [x] Sidebar collapse/expand toggle button
- [x] Sidebar state synced with UI store (persisted)
- [x] Responsive design (collapsed sidebar shows only icons)
- [x] Uses React Router for navigation
- [x] Keyboard accessible (tab navigation, enter to select)
- [x] No type errors exist
- [x] No linting errors exist
- [x] All acceptance criteria are met

## Technical Details
- **File to create**: `frontend/src/components/layout/Sidebar.tsx`

- **Implementation**:
  ```typescript
  import { NavLink } from 'react-router-dom';
  import { History, FileText, GitBranch, GitMerge, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
  import { useUIStore } from '@/stores/uiStore';

  const navItems = [
    { path: '/history', label: 'History', icon: History },
    { path: '/changes', label: 'Changes', icon: FileText },
    { path: '/branches', label: 'Branches', icon: GitBranch },
    { path: '/merge', label: 'Merge', icon: GitMerge },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  export function Sidebar() {
    const { sidebarOpen, toggleSidebar } = useUIStore();

    return (
      <aside
        className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-56' : 'w-16'
        }`}
      >
        {/* Toggle button */}
        <div className="h-14 flex items-center justify-end px-2 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-200 rounded"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="py-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-200 transition-colors ${
                  isActive ? 'bg-gray-200 font-medium' : ''
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    );
  }
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0630-feat-create-ui-store.md

## Notes
- Use `NavLink` from React Router for automatic active state
- Sidebar width: 224px (14rem) when open, 64px (4rem) when collapsed
- Icons should always be visible, even when collapsed
- Toggle button should have clear ARIA label for accessibility
- Consider adding tooltips when sidebar is collapsed (future enhancement)
