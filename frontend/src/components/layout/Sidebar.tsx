import { NavLink } from 'react-router-dom';
import {
  History,
  FileText,
  GitBranch,
  GitMerge,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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
