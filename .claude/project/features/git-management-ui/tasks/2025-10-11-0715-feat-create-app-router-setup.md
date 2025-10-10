# Create App Router Setup with React Router

## Type
feat

## Description
Set up React Router with routes for all main views (History, Changes, Branches, Merge, Settings). Configure the main App component with router, layout structure (header, sidebar, main content area), and route definitions.

## Acceptance Criteria
- [ ] React Router configured in `App.tsx`
- [ ] Routes defined for: `/history`, `/changes`, `/branches`, `/merge`, `/settings`
- [ ] Default route `/` redirects to `/history`
- [ ] App layout includes: AppHeader (top), Sidebar (left), main content area (right)
- [ ] Main content area is scrollable independently of header/sidebar
- [ ] Layout is responsive and uses Flexbox/Grid
- [ ] 404 route for unknown paths
- [ ] All routes render placeholder components initially

## Technical Details
- **File to modify**: `frontend/src/App.tsx`
- **Files to create (placeholders)**:
  - `frontend/src/views/HistoryView.tsx`
  - `frontend/src/views/ChangesView.tsx`
  - `frontend/src/views/BranchesView.tsx`
  - `frontend/src/views/MergeView.tsx`
  - `frontend/src/views/SettingsView.tsx`

- **App.tsx implementation**:
  ```typescript
  import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
  import { AppHeader } from '@/components/layout/AppHeader';
  import { Sidebar } from '@/components/layout/Sidebar';
  import { HistoryView } from '@/views/HistoryView';
  import { ChangesView } from '@/views/ChangesView';
  import { BranchesView } from '@/views/BranchesView';
  import { MergeView } from '@/views/MergeView';
  import { SettingsView } from '@/views/SettingsView';

  function App() {
    return (
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-white">
              <Routes>
                <Route path="/" element={<Navigate to="/history" replace />} />
                <Route path="/history" element={<HistoryView />} />
                <Route path="/changes" element={<ChangesView />} />
                <Route path="/branches" element={<BranchesView />} />
                <Route path="/merge" element={<MergeView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    );
  }

  function NotFound() {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-gray-600 mt-2">Page not found</p>
        </div>
      </div>
    );
  }

  export default App;
  ```

- **Placeholder view example** (`views/HistoryView.tsx`):
  ```typescript
  export function HistoryView() {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Commit History</h1>
        <p className="text-gray-600 mt-2">View will be implemented soon</p>
      </div>
    );
  }
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0645-feat-create-app-header-component.md
- Depends on: 2025-10-11-0700-feat-create-sidebar-component.md

## Notes
- Use Flexbox for layout: vertical for header/content, horizontal for sidebar/main
- `overflow-hidden` on parent, `overflow-auto` on main content for independent scrolling
- Header height: 56px (h-14), Sidebar width: 224px (w-56) or 64px (w-16) when collapsed
- Main content area should fill remaining space and be scrollable
- All placeholder views should follow similar structure for consistency
