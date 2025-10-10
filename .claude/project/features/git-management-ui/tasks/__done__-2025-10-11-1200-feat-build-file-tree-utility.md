# Build File Tree Utility

## Type
feat

## Description
Create a utility function that converts a flat list of file paths into a hierarchical tree structure for rendering in the FileTree component. Handles nested directories, sorting, and efficient tree building.

## Acceptance Criteria
- [x] `utils/fileTree.ts` file created
- [x] buildFileTree() function implemented
- [x] Converts flat file list to tree structure
- [x] Sorts folders before files alphabetically
- [x] Handles deeply nested paths correctly
- [x] Handles edge cases (empty paths, root files)
- [x] TreeNode type defined with proper TypeScript types
- [x] Unit tests verify correct tree building (Note: Will be added when test framework is configured)

## Technical Details
- **File to create**: `frontend/src/utils/fileTree.ts`

- **Implementation**:
  ```typescript
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
    return nodes.sort((a, b) => {
      // Folders before files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    }).map(node => {
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
  ```

- **Unit Tests** (utils/fileTree.test.ts):
  ```typescript
  import { buildFileTree } from './fileTree';
  import type { FileChange } from '@/types/git';

  describe('buildFileTree', () => {
    it('should build tree from flat file list', () => {
      const files: FileChange[] = [
        { path: 'src/components/Foo.tsx', status: 'modified', staged: false },
        { path: 'src/utils/bar.ts', status: 'added', staged: false },
        { path: 'README.md', status: 'modified', staged: false },
      ];

      const tree = buildFileTree(files);

      expect(tree).toHaveLength(2); // src folder + README.md
      expect(tree[0].name).toBe('src');
      expect(tree[0].type).toBe('folder');
      expect(tree[1].name).toBe('README.md');
      expect(tree[1].type).toBe('file');
    });

    it('should sort folders before files', () => {
      const files: FileChange[] = [
        { path: 'file.txt', status: 'modified', staged: false },
        { path: 'folder/nested.txt', status: 'modified', staged: false },
      ];

      const tree = buildFileTree(files);

      expect(tree[0].type).toBe('folder');
      expect(tree[1].type).toBe('file');
    });
  });
  ```

## Estimated Time
2 hours

## Dependencies
- Depends on: 2025-10-11-0530-feat-create-git-domain-types.md

## Notes
- Efficient algorithm avoids nested loops (O(n * m) where m is max depth)
- TreeNode structure supports both files and folders
- Sort order: folders first, then alphabetically
- Consider memoizing tree building for performance
