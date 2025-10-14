import { useState } from 'react';
import { X, AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react';
import { ImportPatchFile } from '../../../wailsjs/go/services/ArchiveService';
import { services } from '../../../wailsjs/go/models';
import toast from 'react-hot-toast';

interface ImportPatchDialogProps {
  patchContent: string;
  fileName: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Dialog for importing patch files with options to apply or create a group
 */
export function ImportPatchDialog({
  patchContent,
  fileName,
  onClose,
  onSuccess,
}: ImportPatchDialogProps) {
  const [mode, setMode] = useState<'apply' | 'group'>('group');
  const [groupName, setGroupName] = useState('');
  const [createBackup, setCreateBackup] = useState(true);
  const [useThreeWay, setUseThreeWay] = useState(true);
  const [allowReject, setAllowReject] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const options = new services.ImportPatchOptions({
        ApplyImmediately: mode === 'apply',
        CreateBackup: mode === 'apply' ? createBackup : false,
        UseThreeWay: mode === 'apply' ? useThreeWay : false,
        AllowReject: mode === 'apply' ? allowReject : false,
        GroupName: mode === 'group' ? groupName : '',
      });

      const result = await ImportPatchFile(patchContent, options);

      if (result.success) {
        if (result.appliedPatch) {
          if (result.restoreResult?.appliedCleanly) {
            toast.success(
              `Patch applied successfully! ${result.filesAffected?.length || 0} file(s) affected.`
            );
          } else if (result.restoreResult?.rejectFiles?.length) {
            toast.success(
              `Patch partially applied with ${result.restoreResult.rejectFiles.length} conflict(s). Check .rej files.`,
              { duration: 5000 }
            );
          }
        } else if (result.createdGroup) {
          toast.success(`Created changelist group "${result.createdChangelist?.name}"`);
        }
        onSuccess();
        onClose();
      } else {
        toast.error(result.errorMessage || 'Failed to import patch');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import patch';
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Import Patch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isImporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* File info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span className="font-mono">{fileName}</span>
          </div>

          {/* Mode selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Import Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="group"
                  checked={mode === 'group'}
                  onChange={(e) => setMode(e.target.value as 'group')}
                  className="mt-0.5"
                  disabled={isImporting}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Create Changelist Group
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Non-destructive: creates a new changelist group with the files from the patch
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="apply"
                  checked={mode === 'apply'}
                  onChange={(e) => setMode(e.target.value as 'apply')}
                  className="mt-0.5"
                  disabled={isImporting}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Apply Now
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Applies the patch directly to your working tree
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Group name input (when mode is 'group') */}
          {mode === 'group' && (
            <div className="space-y-2">
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Group Name (optional)
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={`Imported Patch ${new Date().toLocaleDateString()}`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isImporting}
              />
            </div>
          )}

          {/* Apply options (when mode is 'apply') */}
          {mode === 'apply' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apply Options
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createBackup}
                  onChange={(e) => setCreateBackup(e.target.checked)}
                  disabled={isImporting}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Create backup stash before applying
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useThreeWay}
                  onChange={(e) => setUseThreeWay(e.target.checked)}
                  disabled={isImporting}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Use three-way merge
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowReject}
                  onChange={(e) => setAllowReject(e.target.checked)}
                  disabled={isImporting}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow reject files on conflicts
                </span>
              </label>

              {createBackup && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700 dark:text-blue-300">
                    A backup will be created in your stash before applying the patch
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Warning for apply mode */}
          {mode === 'apply' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Warning:</strong> This will modify your working tree. Make sure you have
                committed or stashed any important changes.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {mode === 'apply' ? 'Apply Patch' : 'Create Group'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
