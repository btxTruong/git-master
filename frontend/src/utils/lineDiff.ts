/**
 * Line-based diff algorithm using Myers' diff algorithm (simplified)
 * This provides a proper LCS-based diff that identifies unchanged, added, and deleted lines
 */

export interface DiffChange {
  type: 'add' | 'delete' | 'context';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

interface EditOperation {
  type: 'equal' | 'insert' | 'delete';
  oldIndex: number;
  newIndex: number;
}

/**
 * Computes the Longest Common Subsequence (LCS) based diff between two arrays of lines
 * Returns a list of edit operations
 */
function computeLCS(oldLines: string[], newLines: string[]): EditOperation[] {
  const m = oldLines.length;
  const n = newLines.length;

  // Create a matrix to store LCS lengths
  const lcs: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Build LCS matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to build the edit script
  const operations: EditOperation[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      // Lines are equal
      operations.unshift({
        type: 'equal',
        oldIndex: i - 1,
        newIndex: j - 1,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Insertion
      operations.unshift({
        type: 'insert',
        oldIndex: -1,
        newIndex: j - 1,
      });
      j--;
    } else if (i > 0) {
      // Deletion
      operations.unshift({
        type: 'delete',
        oldIndex: i - 1,
        newIndex: -1,
      });
      i--;
    }
  }

  return operations;
}

/**
 * Computes a proper line-based diff between old and new content
 * @param oldContent - The old version of the file
 * @param newContent - The new version of the file
 * @returns Array of diff changes with proper line numbers
 */
export function computeLineDiff(oldContent: string, newContent: string): DiffChange[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const operations = computeLCS(oldLines, newLines);
  const changes: DiffChange[] = [];

  let oldLineNum = 1;
  let newLineNum = 1;

  for (const op of operations) {
    switch (op.type) {
      case 'equal':
        changes.push({
          type: 'context',
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
          content: oldLines[op.oldIndex],
        });
        oldLineNum++;
        newLineNum++;
        break;

      case 'delete':
        changes.push({
          type: 'delete',
          oldLineNumber: oldLineNum,
          newLineNumber: null,
          content: oldLines[op.oldIndex],
        });
        oldLineNum++;
        break;

      case 'insert':
        changes.push({
          type: 'add',
          oldLineNumber: null,
          newLineNumber: newLineNum,
          content: newLines[op.newIndex],
        });
        newLineNum++;
        break;
    }
  }

  return changes;
}

/**
 * Groups consecutive changes for inline diff computation
 * Returns pairs of delete/add line indices that should be compared for inline diffs
 */
export function findChangeGroups(
  changes: DiffChange[]
): Map<number, { deleteIndices: number[]; addIndices: number[] }> {
  const groups = new Map<number, { deleteIndices: number[]; addIndices: number[] }>();
  let groupId = 0;
  let currentGroup: { deleteIndices: number[]; addIndices: number[] } | null = null;
  let inChangeBlock = false;

  changes.forEach((change, index) => {
    if (change.type === 'delete' || change.type === 'add') {
      if (!inChangeBlock) {
        // Start a new group
        currentGroup = { deleteIndices: [], addIndices: [] };
        groups.set(groupId, currentGroup);
        inChangeBlock = true;
      }

      if (change.type === 'delete') {
        currentGroup!.deleteIndices.push(index);
      } else {
        currentGroup!.addIndices.push(index);
      }
    } else {
      // Context line - end the current group if any
      if (inChangeBlock) {
        groupId++;
        currentGroup = null;
        inChangeBlock = false;
      }
    }
  });

  return groups;
}
