import type { models } from '../../wailsjs/go/models';

export type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  file?: models.FileChange;
  children?: TreeNode[];
};

export function buildFileTree(files: models.FileChange[]): TreeNode[] {
  const root: TreeNode = {
    name: '',
    path: '',
    type: 'folder',
    children: [],
  };

  for (const file of files) {
    // Use newPath for added/modified, oldPath for deleted
    const filePath = file.newPath || file.oldPath;
    if (!filePath) continue;

    const parts = filePath.split('/').filter(Boolean);
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      const pathSoFar = parts.slice(0, i + 1).join('/');

      if (!currentNode.children) {
        currentNode.children = [];
      }

      // Find existing node or create new one
      let existingNode = currentNode.children.find((child) => child.name === part);

      if (!existingNode) {
        if (isLastPart) {
          // File node
          existingNode = {
            name: part,
            path: pathSoFar,
            type: 'file',
            file: file,
          };
        } else {
          // Folder node
          existingNode = {
            name: part,
            path: pathSoFar,
            type: 'folder',
            children: [],
          };
        }
        currentNode.children.push(existingNode);
      }

      currentNode = existingNode;
    }
  }

  // Return sorted children of root
  return sortNodes(root.children || []);
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      // Folders before files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Alphabetical within same type
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

export function flattenTree(nodes: TreeNode[]): models.FileChange[] {
  const files: models.FileChange[] = [];

  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'file' && node.file) {
        files.push(node.file);
      } else if (node.type === 'folder' && node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return files;
}

export function getFileStatusColor(status: string): string {
  switch (status) {
    case 'A':
      return 'text-green-600 dark:text-green-400';
    case 'M':
      return 'text-blue-600 dark:text-blue-400';
    case 'D':
      return 'text-red-600 dark:text-red-400';
    case 'R':
      return 'text-purple-600 dark:text-purple-400';
    case 'C':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export function getFileStatusLabel(status: string): string {
  switch (status) {
    case 'A':
      return 'Added';
    case 'M':
      return 'Modified';
    case 'D':
      return 'Deleted';
    case 'R':
      return 'Renamed';
    case 'C':
      return 'Copied';
    default:
      return 'Unknown';
  }
}
