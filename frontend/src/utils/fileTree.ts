import type { FileChange } from '@/types/git';

export type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  file?: FileChange;
  children?: TreeNode[];
};

export function buildFileTree(files: FileChange[]): TreeNode[] {
  const root: Map<string, TreeNode> = new Map();

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
          // File node
          currentLevel.set(part, {
            name: part,
            path: currentPath,
            type: 'file',
            file: file,
          });
        } else {
          // Folder node
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
          // Create map for next level
          const childrenMap = new Map<string, TreeNode>();
          for (const child of node.children) {
            childrenMap.set(child.name, child);
          }
          currentLevel = childrenMap;
        }
      }
    }
  }

  // Convert map to sorted array
  return sortNodes(Array.from(root.values()));
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

export function flattenTree(nodes: TreeNode[]): FileChange[] {
  const files: FileChange[] = [];

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
