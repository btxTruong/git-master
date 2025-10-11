import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import type { models } from '../../../wailsjs/go/models';
import {
  buildFileTree,
  getFileStatusColor,
  getFileStatusLabel,
  type TreeNode,
} from '@/utils/fileTree';

interface FileTreePanelProps {
  commitDetail: models.CommitDetail | null;
  onFileSelect: (file: models.FileChange) => void;
  selectedFile: models.FileChange | null;
}

export function FileTreePanel({ commitDetail, onFileSelect, selectedFile }: FileTreePanelProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fileTree = useMemo(() => {
    if (!commitDetail || !commitDetail.files) return [];
    return buildFileTree(commitDetail.files);
  }, [commitDetail]);

  if (!commitDetail) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Select a commit to view changed files
      </div>
    );
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected =
        node.file &&
        selectedFile &&
        (node.file.newPath === selectedFile.newPath || node.file.oldPath === selectedFile.oldPath);

      if (node.type === 'folder') {
        return (
          <div key={node.path}>
            <div
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {node.name}
              </span>
            </div>
            {isExpanded && node.children && renderTree(node.children, depth + 1)}
          </div>
        );
      }

      if (node.file) {
        const statusColor = getFileStatusColor(node.file.status);
        const statusLabel = getFileStatusLabel(node.file.status);

        return (
          <div
            key={node.path}
            onClick={() => onFileSelect(node.file!)}
            className={`
              flex items-center gap-2 px-3 py-1.5 cursor-pointer
              ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-l-transparent'
              }
            `}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <div className="w-4 h-4" /> {/* Spacer for chevron alignment */}
            <File className={`w-4 h-4 ${statusColor}`} />
            <span className={`text-sm ${statusColor} flex-1`}>{node.name}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusColor}`}>
              {statusLabel[0]}
            </span>
            {node.file.insertions > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400">
                +{node.file.insertions}
              </span>
            )}
            {node.file.deletions > 0 && (
              <span className="text-xs text-red-600 dark:text-red-400">-{node.file.deletions}</span>
            )}
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Files Changed ({commitDetail.files?.length || 0})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            No files changed in this commit
          </div>
        )}
      </div>
    </div>
  );
}
