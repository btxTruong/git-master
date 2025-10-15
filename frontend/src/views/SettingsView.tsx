import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GitBranch,
} from 'lucide-react';
import * as CredentialsService from '../../wailsjs/go/services/CredentialsService';
import * as RemoteService from '../../wailsjs/go/services/RemoteService';
import * as RepositoryService from '../../wailsjs/go/services/RepositoryService';
import { services } from '../../wailsjs/go/models';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';
import toast from 'react-hot-toast';
import { TokenDropdown } from '../components/settings/TokenDropdown';

type TabType = 'security';

interface TokenFormData {
  id: string;
  name: string;
  repoPattern: string;
  token: string;
}

/**
 * SettingsView component
 * Application settings and configuration
 */
function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [tokens, setTokens] = useState<services.GitHubToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TokenFormData>({
    id: '',
    name: '',
    repoPattern: '',
    token: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [currentRepo, setCurrentRepo] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    tokenId: string;
    tokenName: string;
  }>({
    show: false,
    tokenId: '',
    tokenName: '',
  });

  useEffect(() => {
    loadTokens();
    loadCurrentRepo();
    loadSelectedToken();
  }, []);

  const loadTokens = async () => {
    setIsLoading(true);
    try {
      const allTokens = await CredentialsService.GetAllGitHubTokens();
      setTokens(allTokens || []);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentRepo = async () => {
    try {
      const repo = await RepositoryService.GetCurrentRepository();
      if (repo && repo.path) {
        setCurrentRepo(repo.path);
      }
    } catch (error) {
      console.error('Failed to load current repository:', error);
    }
  };

  const loadSelectedToken = async () => {
    try {
      const tokenId = await RemoteService.GetSelectedTokenForCurrentRepo();
      setSelectedTokenId(tokenId || '');
    } catch (error) {
      console.error('Failed to load selected token:', error);
    }
  };

  const handleAddNew = () => {
    setFormData({
      id: `token-${Date.now()}`,
      name: '',
      repoPattern: '',
      token: '',
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const tokenData = await CredentialsService.GetGitHubTokenByID(id);
      setFormData({
        id: tokenData.id,
        name: tokenData.name,
        repoPattern: tokenData.repoPattern,
        token: '', // Don't pre-fill the token for security
      });
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      toast.error('Failed to load token details');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (!formData.token.trim() && !editingId) {
      toast.error('Please enter a token');
      return;
    }

    try {
      if (editingId) {
        await CredentialsService.UpdateGitHubTokenWithRepo(
          formData.id,
          formData.name,
          formData.repoPattern,
          formData.token
        );
        toast.success('Token updated successfully');
      } else {
        await CredentialsService.AddGitHubTokenWithRepo(
          formData.id,
          formData.name,
          formData.repoPattern,
          formData.token
        );
        toast.success('Token added successfully');
      }
      setShowForm(false);
      setFormData({ id: '', name: '', repoPattern: '', token: '' });
      setEditingId(null);
      loadTokens();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save token';
      toast.error(message);
    }
  };

  const handleDeleteClick = (id: string) => {
    const token = tokens.find((t) => t.id === id);
    if (token) {
      setDeleteConfirm({
        show: true,
        tokenId: id,
        tokenName: token.name,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.tokenId;

    // Close the confirmation dialog
    setDeleteConfirm({ show: false, tokenId: '', tokenName: '' });

    try {
      await CredentialsService.DeleteGitHubTokenWithRepo(id);
      toast.success('Token deleted successfully');

      // Reload tokens and selected token (in case the deleted token was selected)
      await loadTokens();
      await loadSelectedToken();
    } catch (error) {
      console.error('Error deleting token:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete token';
      toast.error(message);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, tokenId: '', tokenName: '' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ id: '', name: '', repoPattern: '', token: '' });
    setEditingId(null);
    setShowToken(false);
  };

  const handleCreateToken = () => {
    BrowserOpenURL(
      'https://github.com/settings/tokens/new?scopes=repo&description=Git%20Master%20App'
    );
  };

  const handleSelectToken = async (tokenId: string) => {
    try {
      await RemoteService.SetSelectedTokenForCurrentRepo(tokenId);
      setSelectedTokenId(tokenId);
      toast.success(tokenId ? 'Token selected for this repository' : 'Token selection cleared');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select token';
      toast.error(message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your application preferences and security
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with tabs */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Shield className="w-5 h-5" />
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto p-6">
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Current Repository Token Selection */}
                {currentRepo && tokens.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <GitBranch className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5" />
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Default Token for Current Repository
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Select which token to use for this repository
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-5">
                      <TokenDropdown
                        label="Selected Token"
                        value={selectedTokenId}
                        onChange={handleSelectToken}
                        tokens={tokens}
                        placeholder="Auto-select (Pattern matching)"
                        helperText={
                          selectedTokenId
                            ? 'This token will be used for push/pull operations in this repository'
                            : 'The system will automatically select the best matching token based on repository pattern'
                        }
                      />
                    </div>
                  </div>
                )}

                {/* GitHub Tokens Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Section Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5" />
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            GitHub Access Tokens
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Manage tokens for different repositories
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleAddNew}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Token
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="px-6 py-5">
                    {isLoading ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading tokens...</p>
                    ) : tokens.length === 0 && !showForm ? (
                      <div className="text-center py-8">
                        <Key className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          No tokens configured yet
                        </p>
                        <button
                          onClick={handleAddNew}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Your First Token
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Token List */}
                        {tokens.map((token) => (
                          <div
                            key={token.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {token.name}
                                </h3>
                              </div>
                              {token.repoPattern && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {token.repoPattern}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(token.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(token.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add/Edit Form */}
                        {showForm && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
                            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {editingId ? 'Edit Token' : 'Add New Token'}
                            </h3>

                            {/* Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Personal Projects, Work Repos"
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Repository Pattern */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Repository Pattern (optional)
                              </label>
                              <input
                                type="text"
                                value={formData.repoPattern}
                                onChange={(e) =>
                                  setFormData({ ...formData, repoPattern: e.target.value })
                                }
                                placeholder="github.com/username/* or github.com/username/repo"
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Use * to match all repos for a user/org. Leave empty for all
                                repositories.
                              </p>
                            </div>

                            {/* Token */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Access Token {!editingId && <span className="text-red-500">*</span>}
                              </label>
                              <div className="relative">
                                <input
                                  type={showToken ? 'text' : 'password'}
                                  value={formData.token}
                                  onChange={(e) =>
                                    setFormData({ ...formData, token: e.target.value })
                                  }
                                  placeholder={
                                    editingId
                                      ? 'Leave empty to keep existing token'
                                      : 'ghp_xxxxxxxxxxxxxxxxxxxx'
                                  }
                                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowToken(!showToken)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  {showToken ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                              <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                {editingId ? 'Update' : 'Add Token'}
                              </button>

                              <button
                                onClick={handleCreateToken}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors inline-flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Create on GitHub
                              </button>

                              <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors inline-flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {tokens.length > 0 && !showForm && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        Tokens are encrypted and stored securely in your system keychain
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Token
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete the token{' '}
                <strong>"{deleteConfirm.tokenName}"</strong>?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
