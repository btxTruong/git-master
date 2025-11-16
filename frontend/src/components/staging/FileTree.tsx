import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { FileContextMenu } from '@/components/changelist/FileContextMenu';
import { getFileIcon, DEFAULT_ICON_SIZE } from '@/utils/fileIcons';
import type { StagingFileChange } from '@/types/git';
import { useChangelistStore } from '@/stores/changelistStore';

interface FileTreeProps {
  files: StagingFileChange[];
  selectedFile: StagingFileChange | null;
  onFileSelect: (file: StagingFileChange) => void;
  groupId?: string;
  onShowHistory?: (filePath: string) => void;
  groupByFolder?: boolean; // New prop to control tree/flat display
  showCheckboxes?: boolean; // New prop to show checkboxes for selection
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
  const root: StagingTreeNode = {
    name: '',
    path: '',
    type: 'folder',
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (isLastPart) {
        // Add file node
        currentNode.children!.push({
          name: part,
          path: currentPath,
          type: 'file',
          file: file,
        });
      } else {
        // Find or create folder node
        let childFolder = currentNode.children!.find(
          (child) => child.name === part && child.type === 'folder'
        );

        if (!childFolder) {
          childFolder = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          currentNode.children!.push(childFolder);
        }

        currentNode = childFolder;
      }
    }
  }

  return sortNodes(root.children!);
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

// Draggable wrapper component for files
interface DraggableFileProps {
  filePath: string;
  groupId?: string;
  children: React.ReactNode;
  isDraggingEnabled?: boolean;
  selectedFilePaths: string[]; // All selected file paths
}

function DraggableFile({
  filePath,
  groupId,
  children,
  isDraggingEnabled = true,
  selectedFilePaths,
}: DraggableFileProps) {
  // Determine if this file is part of a multi-selection
  const isPartOfSelection = selectedFilePaths.includes(filePath);
  const filesToDrag =
    isPartOfSelection && selectedFilePaths.length > 1 ? selectedFilePaths : [filePath];

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `file-${filePath}-${groupId}`,
    data: {
      type: 'file',
      filePath, // Keep single filePath for backward compatibility
      filePaths: filesToDrag, // Add array of all files being dragged
      groupId,
    },
    disabled: !isDraggingEnabled || !groupId,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDraggingEnabled && groupId ? 'grab' : 'default',
  };

  if (!isDraggingEnabled || !groupId) {
    return <>{children}</>;
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export function FileTree({
  files,
  selectedFile,
  onFileSelect,
  groupId,
  onShowHistory,
  groupByFolder = false,
  showCheckboxes = false,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const tree = groupByFolder ? buildStagingFileTree(files) : [];

  // Get selection state from store
  const selectedFilePaths = useChangelistStore((state) => state.selectedFilePaths);
  const toggleFileSelection = useChangelistStore((state) => state.toggleFileSelection);

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

  // Convert FileStatus enum to single letter
  const getStatusLetter = (status: string): string => {
    const statusMap: Record<string, string> = {
      added: 'A',
      modified: 'M',
      deleted: 'D',
      renamed: 'R',
      copied: 'C',
      untracked: 'U',
    };
    return statusMap[status] || '?';
  };

  // Get color based on file status
  const getStatusColor = (status: string): string => {
    const letter = getStatusLetter(status);
    switch (letter) {
      case 'A': // Added (new file) - GREEN
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'M': // Modified (update) - BLUE
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'D': // Deleted - GREY
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      case 'U': // Untracked - RED
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'R': // Renamed - PURPLE
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'C': // Copied - YELLOW
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Get text color for file name based on status
  const getFileNameColor = (status: string): string => {
    const letter = getStatusLetter(status);
    switch (letter) {
      case 'A': // Added (new file) - GREEN
        return 'text-green-600 dark:text-green-400';
      case 'M': // Modified (update) - BLUE
        return 'text-blue-600 dark:text-blue-400';
      case 'D': // Deleted - GREY
        return 'text-gray-600 dark:text-gray-400';
      case 'U': // Untracked - RED
        return 'text-red-600 dark:text-red-400';
      case 'R': // Renamed - PURPLE
        return 'text-purple-600 dark:text-purple-400';
      case 'C': // Copied - YELLOW
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-900 dark:text-gray-100';
    }
  };

  // Render a flat file list (no folders)
  const renderFlatFile = (file: StagingFileChange, index: number) => {
    const isSelected = selectedFile?.path === file.path;
    const isChecked = selectedFilePaths.includes(file.path);
    const fileName = file.path.split('/').pop() || file.path;
    const FileIcon = getFileIcon(fileName);
    const statusLetter = getStatusLetter(file.status);
    const statusColor = getStatusColor(file.status);
    const fileNameColor = getFileNameColor(file.status);

    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFileSelection(file.path);
    };

    const fileNode = (
      <div
        key={`${file.path}-${index}`}
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
            : isChecked
              ? 'bg-gray-100 dark:bg-gray-800 border-l-4 border-l-gray-400 dark:border-l-gray-600'
              : 'border-l-4 border-l-transparent'
        }`}
        onClick={() => onFileSelect(file)}
      >
        {showCheckboxes && (
          <input
            type="checkbox"
            checked={isChecked}
            onClick={handleCheckboxClick}
            onChange={() => {}}
            className="flex-shrink-0 w-4 h-4 cursor-pointer rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
        )}
        <span
          className={`flex items-center justify-center w-5 h-5 rounded text-xs font-bold flex-shrink-0 ${statusColor}`}
        >
          {statusLetter}
        </span>
        <FileIcon width={DEFAULT_ICON_SIZE} height={DEFAULT_ICON_SIZE} className="flex-shrink-0" />
        <span className={`flex-1 text-sm truncate ${fileNameColor}`}>{file.path}</span>
      </div>
    );

    // Wrap with context menu and draggable if groupId is provided
    if (groupId) {
      return (
        <DraggableFile
          key={`${file.path}-${index}`}
          filePath={file.path}
          groupId={groupId}
          selectedFilePaths={selectedFilePaths}
        >
          <FileContextMenu
            filePath={file.path}
            currentGroupId={groupId}
            onHistoryClick={onShowHistory ? () => onShowHistory(file.path) : undefined}
          >
            {fileNode}
          </FileContextMenu>
        </DraggableFile>
      );
    }

    return fileNode;
  };

  // Render a tree node (file or folder)
  const renderNode = (node: StagingTreeNode, depth: number = 0) => {
    if (node.type === 'file') {
      const isSelected = selectedFile?.path === node.file?.path;
      const isChecked = selectedFilePaths.includes(node.file!.path);
      const FileIcon = getFileIcon(node.name);
      const statusLetter = getStatusLetter(node.file!.status);
      const statusColor = getStatusColor(node.file!.status);
      const fileNameColor = getFileNameColor(node.file!.status);

      const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFileSelection(node.file!.path);
      };

      const fileNode = (
        <div
          key={node.path}
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
              : isChecked
                ? 'bg-gray-100 dark:bg-gray-800 border-l-4 border-l-gray-400 dark:border-l-gray-600'
                : 'border-l-4 border-l-transparent'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => onFileSelect(node.file!)}
        >
          {showCheckboxes ? (
            <input
              type="checkbox"
              checked={isChecked}
              onClick={handleCheckboxClick}
              onChange={() => {}}
              className="flex-shrink-0 w-4 h-4 cursor-pointer rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-4 h-4" /> /* Spacer for chevron alignment */
          )}
          <span
            className={`flex items-center justify-center w-5 h-5 rounded text-xs font-bold flex-shrink-0 ${statusColor}`}
          >
            {statusLetter}
          </span>
          <FileIcon
            width={DEFAULT_ICON_SIZE}
            height={DEFAULT_ICON_SIZE}
            className="flex-shrink-0"
          />
          <span className={`flex-1 text-sm truncate ${fileNameColor}`}>{node.name}</span>
        </div>
      );

      // Wrap with context menu and draggable if groupId is provided
      if (groupId) {
        return (
          <DraggableFile
            key={node.path}
            filePath={node.file!.path}
            groupId={groupId}
            selectedFilePaths={selectedFilePaths}
          >
            <FileContextMenu
              filePath={node.file!.path}
              currentGroupId={groupId}
              onHistoryClick={onShowHistory ? () => onShowHistory(node.file!.path) : undefined}
            >
              {fileNode}
            </FileContextMenu>
          </DraggableFile>
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
          className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => toggleFolder(node.path)}
        >
          <ChevronIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{node.name}</span>
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
    <div className="file-tree overflow-auto h-full bg-white dark:bg-gray-900">
      {groupByFolder
        ? tree.map((node) => renderNode(node))
        : files.map((file, index) => renderFlatFile(file, index))}
    </div>
  );
}
