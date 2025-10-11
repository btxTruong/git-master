import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalShortcuts } from '@/components/common/GlobalShortcuts';
import { HistoryView } from '@/views/HistoryView';
import { ChangesView } from '@/views/ChangesView';
import { BranchesView } from '@/views/BranchesView';
import { MergeView } from '@/views/MergeView';
import { SettingsView } from '@/views/SettingsView';

function App() {
  return (
    <BrowserRouter>
      <GlobalShortcuts />
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

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          // Success notifications
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          // Error notifications
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          // Loading notifications
          loading: {
            duration: Infinity,
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
          // Default style for all toasts
          style: {
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
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
