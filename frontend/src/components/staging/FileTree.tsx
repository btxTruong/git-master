import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { FileContextMenu } from '@/components/changelist/FileContextMenu';
import type { StagingFileChange } from '@/types/git';
import { FileStatus } from '@/types/git';

interface FileTreeProps {
  files: StagingFileChange[];
  selectedFile: StagingFileChange | null;
  onFileSelect: (file: StagingFileChange) => void;
  groupId?: string;
  onShowHistory?: (filePath: string) => void;
}

// Simple tree node for staging area
interface StagingTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  file?: StagingFileChange;
  children?: StagingTreeNode[];
}

// Build tree for staging files
function buildStagingFileTree(files: StagingFileChange[]): StagingTreeNode[] {
  const root: Map<string, StagingTreeNode> = new Map();

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let currentPath = '';
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!currentLevel.has(part)) {
        if (isLastPart) {
          currentLevel.set(part, {
            name: part,
            path: currentPath,
            type: 'file',
            file: file,
          });
        } else {
          currentLevel.set(part, {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          });
        }
      }

      if (!isLastPart) {
        const node = currentLevel.get(part)!;
        if (node.type === 'folder' && node.children) {
          const childrenMap = new Map<string, StagingTreeNode>();
          for (const child of node.children) {
            childrenMap.set(child.name, child);
          }
          currentLevel = childrenMap;
        }
      }
    }
  }

  return sortNodes(Array.from(root.values()));
}

function sortNodes(nodes: StagingTreeNode[]): StagingTreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .map((node) => {
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: sortNodes(node.children),
        };
      }
      return node;
    });
}

export function FileTree({
  files,
  selectedFile,
  onFileSelect,
  groupId,
  onShowHistory,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const tree = buildStagingFileTree(files);

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

  const renderNode = (node: StagingTreeNode, depth: number = 0) => {
    if (node.type === 'file') {
      const isSelected = selectedFile?.path === node.file?.path;
      const statusColor = {
        [FileStatus.Modified]: 'text-blue-600',
        [FileStatus.Added]: 'text-green-600',
        [FileStatus.Deleted]: 'text-red-600',
        [FileStatus.Renamed]: 'text-purple-600',
        [FileStatus.Copied]: 'text-purple-600',
        [FileStatus.Untracked]: 'text-gray-600',
      }[node.file!.status];

      const statusLabel = {
        [FileStatus.Modified]: 'M',
        [FileStatus.Added]: 'A',
        [FileStatus.Deleted]: 'D',
        [FileStatus.Renamed]: 'R',
        [FileStatus.Copied]: 'C',
        [FileStatus.Untracked]: 'U',
      }[node.file!.status];

      const fileNode = (
        <div
          key={node.path}
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onFileSelect(node.file!)}
        >
          <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{node.name}</span>
          <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
      );

      // Wrap with context menu if groupId is provided
      if (groupId) {
        return (
          <FileContextMenu
            key={node.path}
            filePath={node.file!.path}
            currentGroupId={groupId}
            onHistoryClick={onShowHistory ? () => onShowHistory(node.file!.path) : undefined}
          >
            {fileNode}
          </FileContextMenu>
        );
      }

      return fileNode;
    }

    const isExpanded = expandedFolders.has(node.path);
    const Icon = isExpanded ? FolderOpen : Folder;
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => toggleFolder(node.path)}
        >
          <ChevronIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">{node.name}</span>
          <span className="text-xs text-gray-400">({node.children!.length})</span>
        </div>

        {isExpanded && (
          <div className="transition-all duration-200">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-tree overflow-auto h-full bg-white">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}
