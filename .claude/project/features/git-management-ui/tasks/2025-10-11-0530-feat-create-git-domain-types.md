# Create Git Domain TypeScript Types

## Type
feat

## Description
Define TypeScript interfaces and types for all Git domain entities (Commit, Branch, DiffResult, FileChange, Repository, etc.). These types will be used throughout the application and must match the Go backend models.

## Acceptance Criteria
- [ ] `types/git.ts` file created with all Git domain types
- [ ] Types include: Commit, Branch, Repository, DiffResult, DiffHunk, FileChange, ConflictFile
- [ ] All required fields are non-nullable
- [ ] Optional fields properly marked with `?`
- [ ] Date fields use `Date` type (will be converted from string)
- [ ] Enums created for file status and change type
- [ ] Types are exported and available for import

## Technical Details
- **File to create**: `frontend/src/types/git.ts`

- **Type definitions**:
  ```typescript
  // Repository
  export interface Repository {
    path: string;
    name: string;
    currentBranch: string;
    isDetached: boolean;
  }

  // Commit
  export interface Commit {
    hash: string;
    shortHash: string;
    author: string;
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
  }

  // Diff
  export enum FileStatus {
    Added = 'added',
    Modified = 'modified',
    Deleted = 'deleted',
    Renamed = 'renamed',
    Copied = 'copied',
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

  export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    content: string;
    isCollapsed: boolean;
  }

  export interface DiffResult {
    file: FileChange;
    hunks: DiffHunk[];
    language: string;
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
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0445-chore-create-project-folder-structure.md

## Notes
- These types must match Go backend models exactly
- Date fields are strings in JSON, convert to Date objects in API layer
- Consider adding JSDoc comments for complex types
- Export all types as named exports for better tree shaking
