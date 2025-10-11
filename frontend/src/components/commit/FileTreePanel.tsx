import { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { models } from '../../../wailsjs/go/models';
import { buildFileTree, getFileStatusColor, type TreeNode } from '@/utils/fileTree';

interface FileTreePanelProps {
  commitDetail: models.CommitDetail | null;
  onFileSelect: (file: models.FileChange) => void;
  selectedFile: models.FileChange | null;
}

// Helper to get all folder paths from tree
function getAllFolderPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];

  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        paths.push(node.path);
        if (node.children) {
          traverse(node.children);
        }
      }
    }
  }

  traverse(nodes);
  return paths;
}

export function FileTreePanel({ commitDetail, onFileSelect, selectedFile }: FileTreePanelProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fileTree = useMemo(() => {
    if (!commitDetail || !commitDetail.files) return [];
    return buildFileTree(commitDetail.files);
  }, [commitDetail]);

  // Expand all folders by default when commit changes
  useEffect(() => {
    if (fileTree.length > 0) {
      const allFolders = getAllFolderPaths(fileTree);
      setExpandedFolders(new Set(allFolders));
    }
  }, [fileTree]);

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

  const expandAll = () => {
    const allFolders = getAllFolderPaths(fileTree);
    setExpandedFolders(new Set(allFolders));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const allExpanded = useMemo(() => {
    const allFolders = getAllFolderPaths(fileTree);
    return allFolders.length > 0 && allFolders.every((path) => expandedFolders.has(path));
  }, [fileTree, expandedFolders]);

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
            <span
              className={`flex items-center justify-center w-5 h-5 rounded text-xs font-bold flex-shrink-0 ${statusColor}`}
            >
              {node.file.status}
            </span>
            <File className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate">
              {node.name}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {node.file.insertions > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                  +{node.file.insertions}
                </span>
              )}
              {node.file.deletions > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400 font-mono">
                  -{node.file.deletions}
                </span>
              )}
            </div>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Files Changed ({commitDetail.files?.length || 0})
        </h3>
        {fileTree.length > 0 && (
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title={allExpanded ? 'Collapse all' : 'Expand all'}
          >
            {allExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Expand All
              </>
            )}
          </button>
        )}
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
