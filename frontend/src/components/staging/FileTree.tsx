import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import type { FileChange } from '@/types/git';
import { FileStatus } from '@/types/git';
import { buildFileTree, type TreeNode } from '@/utils/fileTree';

interface FileTreeProps {
  files: FileChange[];
  selectedFile: FileChange | null;
  onFileSelect: (file: FileChange) => void;
}

export function FileTree({ files, selectedFile, onFileSelect }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const tree = buildFileTree(files);

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

  const renderNode = (node: TreeNode, depth: number = 0) => {
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

      return (
        <div
          key={node.path}
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onFileSelect(node.file!)}
        >
          <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{node.name}</span>
          <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
      );
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
