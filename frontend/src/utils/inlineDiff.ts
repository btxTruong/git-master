import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

export interface InlineDiffSegment {
  text: string;
  type: 'equal' | 'insert' | 'delete';
}

/**
 * Computes character-level diff between two strings
 * @param oldText - The old version of the text
 * @param newText - The new version of the text
 * @returns Array of segments with their types (equal, insert, delete)
 */
export function computeInlineDiff(
  oldText: string,
  newText: string
): { oldSegments: InlineDiffSegment[]; newSegments: InlineDiffSegment[] } {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const oldSegments: InlineDiffSegment[] = [];
  const newSegments: InlineDiffSegment[] = [];

  for (const [operation, text] of diffs) {
    if (operation === DiffMatchPatch.DIFF_EQUAL) {
      oldSegments.push({ text, type: 'equal' });
      newSegments.push({ text, type: 'equal' });
    } else if (operation === DiffMatchPatch.DIFF_DELETE) {
      oldSegments.push({ text, type: 'delete' });
    } else if (operation === DiffMatchPatch.DIFF_INSERT) {
      newSegments.push({ text, type: 'insert' });
    }
  }

  return { oldSegments, newSegments };
}

/**
 * Finds matching deletion and addition lines for inline diff highlighting
 * This is used to pair up delete/add lines that represent changes rather than pure add/delete
 */
export function findMatchingLines(
  deleteLines: Array<{ index: number; content: string }>,
  addLines: Array<{ index: number; content: string }>
): Map<number, number> {
  const matches = new Map<number, number>();

  // Simple heuristic: match consecutive delete/add pairs
  const minLength = Math.min(deleteLines.length, addLines.length);
  for (let i = 0; i < minLength; i++) {
    const deleteLine = deleteLines[i];
    const addLine = addLines[i];

    // Only match if lines are somewhat similar (basic heuristic)
    const similarity = calculateSimilarity(deleteLine.content, addLine.content);
    if (similarity > 0.3) {
      matches.set(deleteLine.index, addLine.index);
    }
  }

  return matches;
}

/**
 * Calculates similarity between two strings (0 to 1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
