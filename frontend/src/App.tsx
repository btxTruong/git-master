import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalShortcuts } from '@/components/common/GlobalShortcuts';
import { Spinner } from '@/components/common/Spinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { logError } from '@/utils/errorHandling';

// Code-split route components
const HistoryView = lazy(() => import('@/views/HistoryView'));
const ChangesView = lazy(() => import('@/views/ChangesView'));
const SettingsView = lazy(() => import('@/views/SettingsView'));

function App() {
  // Initialize theme
  useTheme();

  return (
    <ErrorBoundary onError={(error) => logError(error, 'App')}>
      <BrowserRouter>
        <GlobalShortcuts />
        <div className="flex flex-col h-screen">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 pb-4">
              <ErrorBoundary onError={(error) => logError(error, 'Routes')}>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/history" replace />} />
                    <Route path="/history" element={<HistoryView />} />
                    <Route path="/changes" element={<ChangesView />} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
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
    </ErrorBoundary>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Page not found</p>
      </div>
    </div>
  );
}

export default App;
