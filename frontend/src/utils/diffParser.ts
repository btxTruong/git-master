import { FileStatus } from '@/types/git';
import type { DiffResult, FileDiff, DiffHunk } from '@/types/git';

/**
 * Detects the programming language based on file extension
 * @param filePath - The file path to detect language from
 * @returns The Prism language identifier
 */
export function detectLanguage(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    mjs: 'javascript',
    cjs: 'javascript',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',

    // Python
    py: 'python',
    pyw: 'python',

    // Java/JVM
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    scala: 'scala',
    groovy: 'groovy',

    // C family
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',

    // Go
    go: 'go',

    // Rust
    rs: 'rust',

    // Ruby
    rb: 'ruby',
    erb: 'erb',

    // PHP
    php: 'php',
    phtml: 'php',

    // Shell
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'bash',

    // Markup
    xml: 'xml',
    svg: 'xml',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    md: 'markdown',
    markdown: 'markdown',

    // SQL
    sql: 'sql',

    // Other
    vim: 'vim',
    dockerfile: 'docker',
    makefile: 'makefile',
    graphql: 'graphql',
    gql: 'graphql',
  };

  // Check filename patterns
  const filename = filePath.split('/').pop()?.toLowerCase() || '';
  if (filename === 'dockerfile') return 'docker';
  if (filename === 'makefile') return 'makefile';
  if (filename === 'cmakelists.txt') return 'cmake';

  return languageMap[extension] || 'text';
}

/**
 * Parses Git diff output into structured DiffResult
 * @param diffText - Raw Git diff output
 * @returns Parsed diff result with files and hunks
 */
export function parseDiff(diffText: string): DiffResult {
  const files: FileDiff[] = [];

  if (!diffText || diffText.trim() === '') {
    return { files };
  }

  const lines = diffText.split('\n');
  let currentFile: FileDiff | null = null;
  let currentHunk: DiffHunk | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header: diff --git a/path b/path
    if (line.startsWith('diff --git')) {
      // Save previous file if exists
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk);
      }
      if (currentFile) {
        files.push(currentFile);
      }

      // Extract file paths
      const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
      const oldPath = match?.[1] || '';
      const newPath = match?.[2] || '';

      currentFile = {
        path: newPath,
        oldPath: oldPath !== newPath ? oldPath : null,
        status: FileStatus.Modified,
        additions: 0,
        deletions: 0,
        isBinary: false,
        hunks: [],
        language: detectLanguage(newPath),
      };
      currentHunk = null;
      continue;
    }

    // New file mode
    if (line.startsWith('new file mode') && currentFile) {
      currentFile.status = FileStatus.Added;
      continue;
    }

    // Deleted file mode
    if (line.startsWith('deleted file mode') && currentFile) {
      currentFile.status = FileStatus.Deleted;
      continue;
    }

    // Renamed file
    if (line.startsWith('rename from') && currentFile) {
      currentFile.status = FileStatus.Renamed;
      continue;
    }

    // Binary file
    if (line.match(/^Binary files/) && currentFile) {
      currentFile.isBinary = true;
      continue;
    }

    // Hunk header: @@ -1,3 +1,4 @@
    if (line.startsWith('@@')) {
      // Save previous hunk if exists
      if (currentHunk && currentFile) {
        currentFile.hunks.push(currentHunk);
      }

      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/);
      if (match && currentFile) {
        const oldStart = parseInt(match[1], 10);
        const oldLines = match[2] ? parseInt(match[2], 10) : 1;
        const newStart = parseInt(match[3], 10);
        const newLines = match[4] ? parseInt(match[4], 10) : 1;

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          header: line,
          lines: [],
          isCollapsed: false,
        };
      }
      continue;
    }

    // Diff line content
    if (currentHunk && currentFile) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        // Addition
        currentHunk.lines.push({
          type: 'add',
          oldLineNumber: null,
          newLineNumber:
            currentHunk.newStart +
            currentHunk.lines.filter((l) => l.type === 'add' || l.type === 'context').length,
          content: line.substring(1),
        });
        currentFile.additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Deletion
        currentHunk.lines.push({
          type: 'delete',
          oldLineNumber:
            currentHunk.oldStart +
            currentHunk.lines.filter((l) => l.type === 'delete' || l.type === 'context').length,
          newLineNumber: null,
          content: line.substring(1),
        });
        currentFile.deletions++;
      } else if (line.startsWith(' ')) {
        // Context line
        const contextOldLines = currentHunk.lines.filter(
          (l) => l.type === 'delete' || l.type === 'context'
        ).length;
        const contextNewLines = currentHunk.lines.filter(
          (l) => l.type === 'add' || l.type === 'context'
        ).length;

        currentHunk.lines.push({
          type: 'context',
          oldLineNumber: currentHunk.oldStart + contextOldLines,
          newLineNumber: currentHunk.newStart + contextNewLines,
          content: line.substring(1),
        });
      }
    }
  }

  // Save last hunk and file
  if (currentHunk && currentFile) {
    currentFile.hunks.push(currentHunk);
  }
  if (currentFile) {
    files.push(currentFile);
  }

  return { files };
}
