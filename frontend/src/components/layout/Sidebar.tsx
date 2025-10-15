import { NavLink } from 'react-router-dom';
import { History, FileText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useStagingStore } from '@/stores/stagingStore';

const navItems = [
  { path: '/history', label: 'History', icon: History },
  { path: '/changes', label: 'Changes', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { stagedFiles, unstagedFiles, untrackedFiles } = useStagingStore();

  // Calculate total tracked changes count
  const trackedChangesCount = stagedFiles.length + unstagedFiles.length + untrackedFiles.length;

  return (
    <aside
      className={`bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}
    >
      {/* Toggle button */}
      <div className="h-14 flex items-center justify-end px-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="py-4">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isChangesTab = path === '/changes';
          const showBadge = isChangesTab && trackedChangesCount > 0;

          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative ${
                  isActive ? 'bg-gray-200 dark:bg-gray-700 font-medium' : ''
                }`
              }
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {showBadge && !sidebarOpen && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full border-2 border-gray-50 dark:border-gray-800">
                    {trackedChangesCount > 9 ? '9+' : trackedChangesCount}
                  </span>
                )}
              </div>
              {sidebarOpen && <span>{label}</span>}
              {showBadge && sidebarOpen && (
                <span className="ml-auto flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {trackedChangesCount > 99 ? '99+' : trackedChangesCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
