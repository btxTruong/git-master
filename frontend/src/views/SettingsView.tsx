import { useState } from 'react';
import { Settings, Palette, Sliders, Code } from 'lucide-react';

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
export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Customize your Git Master experience</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex px-6 gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
        <p className="text-sm text-gray-600 mb-6">Customize the look and feel of Git Master</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Theme</h3>
        <p className="text-sm text-gray-600 mb-4">Choose your preferred color scheme</p>
        <p className="text-sm text-gray-500">Theme switcher will be implemented in the next task</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Diff View</h3>
        <p className="text-sm text-gray-600 mb-4">Default view mode for code differences</p>
        <p className="text-sm text-gray-500">Diff view preferences will be added soon</p>
      </div>
    </div>
  );
}

/**
 * Behavior settings tab
 */
function BehaviorSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Behavior</h2>
        <p className="text-sm text-gray-600 mb-6">Configure how Git Master behaves</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Commit Behavior</h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              defaultChecked
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-stage modified files</p>
              <p className="text-xs text-gray-600">
                Automatically stage modified files when committing
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Sign commits with GPG</p>
              <p className="text-xs text-gray-600">Automatically sign commits using your GPG key</p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Auto Refresh</h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              defaultChecked
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-refresh on file changes</p>
              <p className="text-xs text-gray-600">Automatically refresh views when files change</p>
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced</h2>
        <p className="text-sm text-gray-600 mb-6">Advanced options for power users</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Performance</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="commit-limit" className="block text-sm font-medium text-gray-900 mb-2">
              Commits per page
            </label>
            <input
              id="commit-limit"
              type="number"
              defaultValue={100}
              min={10}
              max={1000}
              className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Number of commits to load at once (10-1000)
            </p>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              defaultChecked
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Enable virtualization</p>
              <p className="text-xs text-gray-600">
                Use virtual scrolling for better performance with large lists
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Git Configuration</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="diff-algorithm"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Diff algorithm
            </label>
            <select
              id="diff-algorithm"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="histogram"
            >
              <option value="myers">Myers</option>
              <option value="minimal">Minimal</option>
              <option value="patience">Patience</option>
              <option value="histogram">Histogram</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">Algorithm used for calculating diffs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500">
            Reset all settings to defaults
          </button>
          <p className="text-xs text-gray-600">
            This will reset all settings to their default values
          </p>
        </div>
      </div>
    </div>
  );
}
