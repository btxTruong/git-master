import { useState } from 'react';
import { Settings, Palette, Sliders, Code, Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore, type Theme } from '@/stores/uiStore';

type SettingsTab = 'appearance' | 'behavior' | 'advanced';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: 'behavior',
    label: 'Behavior',
    icon: <Sliders className="w-4 h-4" />,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <Code className="w-4 h-4" />,
  },
];

/**
 * SettingsView component
 * Displays application settings organized in tabs
 */
function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Customize your Git Master experience
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <nav className="flex px-6 gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'behavior' && <BehaviorSettings />}
          {activeTab === 'advanced' && <AdvancedSettings />}
        </div>
      </div>
    </div>
  );
}

/**
 * Appearance settings tab
 */
function AppearanceSettings() {
  const { theme, setTheme, diffViewMode, setDiffViewMode } = useUIStore();

  const themes: { value: Theme; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="w-5 h-5" />,
      description: 'Light color scheme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className="w-5 h-5" />,
      description: 'Dark color scheme',
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className="w-5 h-5" />,
      description: 'Follow system preference',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize the look and feel of Git Master
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Theme</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose your preferred color scheme
        </p>

        <div className="grid grid-cols-1 gap-3">
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                theme === themeOption.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  theme === themeOption.value
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {themeOption.icon}
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-medium ${
                    theme === themeOption.value
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {themeOption.label}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {themeOption.description}
                </p>
              </div>
              {theme === themeOption.value && (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Diff View</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Default view mode for code differences
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDiffViewMode('unified')}
            className={`p-4 rounded-lg border-2 transition-all ${
              diffViewMode === 'unified'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
            }`}
          >
            <p className="text-sm font-medium">Unified</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Single column view</p>
          </button>

          <button
            onClick={() => setDiffViewMode('split')}
            className={`p-4 rounded-lg border-2 transition-all ${
              diffViewMode === 'split'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
            }`}
          >
            <p className="text-sm font-medium">Split</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Side-by-side view</p>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Behavior settings tab
 */
function BehaviorSettings() {
  const {
    autoRefresh,
    setAutoRefresh,
    dateFormat,
    setDateFormat,
    showLineNumbers,
    setShowLineNumbers,
  } = useUIStore();

  const dateFormats: { value: typeof dateFormat; label: string; description: string }[] = [
    {
      value: 'relative',
      label: 'Relative',
      description: '2 hours ago, 3 days ago',
    },
    {
      value: 'absolute',
      label: 'Absolute',
      description: 'Oct 12, 2025 3:30 PM',
    },
    {
      value: 'both',
      label: 'Both',
      description: 'Oct 12, 2025 (2 hours ago)',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Behavior</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure how Git Master behaves
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Date Format</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          How dates and times are displayed
        </p>

        <div className="grid grid-cols-1 gap-3">
          {dateFormats.map((format) => (
            <button
              key={format.value}
              onClick={() => setDateFormat(format.value)}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                dateFormat === format.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    dateFormat === format.value
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {format.label}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {format.description}
                </p>
              </div>
              {dateFormat === format.value && (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
          Display Options
        </h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Show line numbers in diffs
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Display line numbers in the diff viewer
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Auto Refresh</h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Auto-refresh on file changes
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Automatically refresh views when files change
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Advanced settings tab
 */
function AdvancedSettings() {
  const { commitLimit, setCommitLimit, virtualizationThreshold, setVirtualizationThreshold } =
    useUIStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Advanced</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Advanced options for power users
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Performance</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="commit-limit"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              Commits per page
            </label>
            <input
              id="commit-limit"
              type="number"
              value={commitLimit}
              onChange={(e) => setCommitLimit(Number(e.target.value))}
              min={10}
              max={1000}
              className="w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Number of commits to load at once (10-1000)
            </p>
          </div>

          <div>
            <label
              htmlFor="virtualization-threshold"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              Virtualization threshold
            </label>
            <input
              id="virtualization-threshold"
              type="number"
              value={virtualizationThreshold}
              onChange={(e) => setVirtualizationThreshold(Number(e.target.value))}
              min={50}
              max={500}
              className="w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Enable virtual scrolling when list exceeds this many items (50-500)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
          Git Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="diff-algorithm"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              Diff algorithm
            </label>
            <select
              id="diff-algorithm"
              className="w-full max-w-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="histogram"
            >
              <option value="myers">Myers</option>
              <option value="minimal">Minimal</option>
              <option value="patience">Patience</option>
              <option value="histogram">Histogram</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Algorithm used for calculating diffs
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <button className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500">
            Reset all settings to defaults
          </button>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            This will reset all settings to their default values
          </p>
        </div>
      </div>
    </div>
  );
}
export default SettingsView;
