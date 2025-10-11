// Repository
export interface Repository {
  path: string;
  name: string;
  currentBranch: string;
  isDetached: boolean;
}

// Author
export interface Author {
  name: string;
  email: string;
}

// Commit
export interface Commit {
  hash: string;
  shortHash: string;
  author: Author;
  authorEmail: string;
  date: Date;
  message: string;
  parents: string[];
  filesChanged: number;
  additions: number;
  deletions: number;
}

// Branch
export interface Branch {
  name: string;
  fullName: string;
  remote: boolean;
  current: boolean;
  upstream: string | null;
  lastCommit: Commit | null;
  ahead?: number;
  behind?: number;
}

// Diff
export enum FileStatus {
  Added = 'added',
  Modified = 'modified',
  Deleted = 'deleted',
  Renamed = 'renamed',
  Copied = 'copied',
  Untracked = 'untracked',
}

export interface FileChange {
  path: string;
  oldPath: string | null;
  status: FileStatus;
  additions: number;
  deletions: number;
  isBinary: boolean;
  staged: boolean;
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
  isCollapsed: boolean;
}

export interface FileDiff {
  path: string;
  oldPath: string | null;
  status: FileStatus;
  additions: number;
  deletions: number;
  isBinary: boolean;
  hunks: DiffHunk[];
  language: string;
}

export interface DiffResult {
  files: FileDiff[];
}

// Merge conflicts
export interface ConflictFile {
  path: string;
  base: string;
  ours: string;
  theirs: string;
  resolved: boolean;
}

// Stash
export interface Stash {
  index: number;
  message: string;
  branch: string;
  date: Date;
}

// Remote
export interface Remote {
  name: string;
  url: string;
  fetchUrl: string;
  pushUrl: string;
}

// Rebase
export enum RebaseAction {
  Pick = 'pick',
  Reword = 'reword',
  Edit = 'edit',
  Squash = 'squash',
  Fixup = 'fixup',
  Drop = 'drop',
}

export interface RebaseCommit {
  hash: string;
  shortHash: string;
  message: string;
  action: RebaseAction;
}

export interface RebaseState {
  isRebasing: boolean;
  commits: RebaseCommit[];
  currentCommit: string | null;
  targetBranch: string | null;
}
