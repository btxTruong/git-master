# Product Requirements Document: Git Operations Backend

## Overview

This document defines the backend requirements for a Git management desktop application built with Wails v2. The backend provides a comprehensive Go-based service layer that executes native Git commands via `os/exec` and exposes functionality to the React frontend through Wails bindings.

The backend must handle all Git operations that a professional developer would expect in a modern Git client, matching the capabilities of JetBrains IDE Git tools.

## User Stories

### Core User Workflows

**As a developer, I want to:**

1. **Repository Management**
   - Open existing Git repositories through a file dialog
   - Validate that the selected directory is a valid Git repository
   - Switch between multiple repositories in the same session
   - See repository information (current branch, remote URLs, status)

2. **Commit History Browsing**
   - View commit history with pagination (100 commits per page)
   - See commit metadata (hash, author, date, message, parent commits)
   - Filter commits by branch, author, date range, or message text
   - Navigate to specific commits by hash
   - View commit details including changed files and statistics

3. **Diff Viewing**
   - See differences between commits
   - View working directory changes (staged and unstaged)
   - Compare any two commits
   - See file-level diffs with line numbers and syntax context
   - View binary file changes (detected, not diffed)
   - Handle large diffs efficiently (>10,000 lines)

4. **Branch Operations**
   - List all local and remote branches
   - Create new branches from current HEAD or specific commits
   - Delete local and remote branches
   - Switch between branches (checkout)
   - Merge branches with automatic conflict detection
   - Rebase branches with conflict handling
   - Rename branches

5. **Staging and Committing**
   - Stage individual files or all changes
   - Unstage files
   - Create commits with messages
   - Amend the last commit
   - View staged vs unstaged changes in real-time

6. **Remote Operations**
   - Fetch from remote repositories
   - Pull with merge or rebase strategies
   - Push local commits to remote branches
   - Handle authentication for HTTPS and SSH
   - Track push/pull progress for large operations

7. **Advanced Operations**
   - Detect and resolve merge conflicts
   - Stash changes (save, list, apply, drop)
   - Cherry-pick commits
   - Reset branches (soft, mixed, hard)
   - Handle submodules
   - View and manage tags

## Requirements

### Functional Requirements

#### 1. Repository Service

**FR-1.1: Repository Opening and Validation**
- Must validate that selected directory contains a `.git` folder
- Must detect bare repositories and reject them (or handle appropriately)
- Must extract repository metadata: current branch, remote URLs, HEAD commit
- Must handle repositories in detached HEAD state
- Must support repositories with multiple remotes

**FR-1.2: Repository Information**
- Must return current branch name
- Must list all configured remotes with URLs
- Must detect repository state (clean, dirty, merging, rebasing, cherry-picking)
- Must count staged, unstaged, and untracked files
- Must identify if repository is up-to-date with remote

**FR-1.3: Repository Validation**
- Must detect corrupted repositories and return meaningful errors
- Must check Git installation and version
- Must validate repository access permissions

#### 2. Commit Service

**FR-2.1: Commit History Retrieval**
- Must support pagination (limit/offset parameters)
- Must parse commit hash (full and abbreviated)
- Must parse author name and email
- Must parse committer name and email (if different from author)
- Must parse commit date and author date
- Must parse commit message (subject and body separately)
- Must parse parent commit hashes (for merge commits)
- Must include commit statistics (files changed, insertions, deletions)

**FR-2.2: Commit Filtering**
- Must filter by branch name
- Must filter by date range (after/before dates)
- Must filter by author email or name
- Must search commit messages (case-insensitive)
- Must filter by file path (commits affecting specific files)
- Must support multiple filters simultaneously

**FR-2.3: Commit Details**
- Must retrieve full commit information by hash
- Must list all files changed in a commit
- Must provide file-level statistics (lines added/removed per file)
- Must detect file operations (add, modify, delete, rename, copy)
- Must handle commits with no parent (initial commit)
- Must handle merge commits with multiple parents

**FR-2.4: Creating Commits**
- Must create commits with provided message
- Must support multi-line commit messages
- Must validate that staging area is not empty
- Must support amend operation for last commit
- Must preserve author information when amending
- Must support empty commits (with flag)

#### 3. Branch Service

**FR-3.1: Branch Listing**
- Must list all local branches
- Must list all remote tracking branches
- Must identify current branch
- Must show last commit hash for each branch
- Must show upstream tracking information
- Must detect ahead/behind status relative to upstream

**FR-3.2: Branch Creation**
- Must create branch from current HEAD
- Must create branch from specific commit hash
- Must validate branch name format
- Must prevent duplicate branch names
- Must support creating and checking out in one operation

**FR-3.3: Branch Deletion**
- Must delete local branches
- Must prevent deletion of current branch
- Must warn if branch has unmerged commits
- Must support force deletion
- Must delete remote tracking branches
- Must push deletion to remote repositories

**FR-3.4: Branch Switching (Checkout)**
- Must switch to existing local branch
- Must handle dirty working directory (block or stash)
- Must support creating and switching to new branch
- Must update working directory files
- Must emit progress for large checkouts

**FR-3.5: Branch Operations**
- Must rename local branches
- Must set upstream tracking branch
- Must unset upstream tracking branch

#### 4. Diff Service

**FR-4.1: Working Directory Diffs**
- Must generate diffs for unstaged changes
- Must generate diffs for staged changes
- Must show both staged and unstaged changes for same file
- Must detect new untracked files
- Must detect deleted files
- Must detect renamed files (with similarity threshold)
- Must detect file mode changes (permissions)

**FR-4.2: Commit Diffs**
- Must generate diff between two commits
- Must generate diff between commit and working directory
- Must generate diff for a single commit (vs parent)
- Must handle merge commits (diff against each parent)

**FR-4.3: Diff Parsing**
- Must parse unified diff format
- Must extract file paths (old and new)
- Must parse hunks with line numbers
- Must parse added/removed/context lines
- Must preserve line endings (LF, CRLF)
- Must handle binary files (detect, don't attempt to diff)
- Must handle submodule changes

**FR-4.4: Diff Options**
- Must support ignoring whitespace changes
- Must support ignoring whitespace at EOL
- Must support ignoring all whitespace
- Must support context lines configuration (3 by default)
- Must support word-level diffs
- Must support patience diff algorithm

#### 5. Merge Service

**FR-5.1: Merge Operations**
- Must merge specified branch into current branch
- Must detect merge conflicts before merging
- Must support fast-forward merges
- Must support no-fast-forward merges (always create merge commit)
- Must support squash merges
- Must abort merge on conflict (if requested)

**FR-5.2: Conflict Detection**
- Must detect conflicted files
- Must parse conflict markers
- Must extract "ours" and "theirs" versions
- Must extract base version if available
- Must report conflict type (content, rename, delete)

**FR-5.3: Conflict Resolution**
- Must stage resolved files
- Must verify all conflicts are resolved before allowing commit
- Must support taking "ours" or "theirs" version for entire file
- Must complete merge commit after resolution

**FR-5.4: Merge Abort**
- Must abort in-progress merge
- Must restore working directory to pre-merge state
- Must clean up Git merge state files

#### 6. Staging Service

**FR-6.1: Staging Operations**
- Must stage individual files by path
- Must stage all changes
- Must support staging partial hunks (interactive staging)
- Must unstage individual files
- Must unstage all changes
- Must reset files to HEAD (discard changes)

**FR-6.2: Status Reporting**
- Must report staged files
- Must report unstaged files
- Must report untracked files
- Must report deleted files
- Must report renamed files
- Must report copied files
- Must distinguish between staged and unstaged changes for same file

#### 7. Remote Service

**FR-7.1: Fetch Operations**
- Must fetch from default remote
- Must fetch from specified remote
- Must fetch all remotes
- Must fetch specific branches
- Must prune deleted remote branches
- Must emit progress events during fetch

**FR-7.2: Pull Operations**
- Must pull from upstream branch
- Must support merge strategy
- Must support rebase strategy
- Must handle merge conflicts during pull
- Must emit progress events during pull

**FR-7.3: Push Operations**
- Must push current branch to upstream
- Must push specific branch to remote
- Must support force push (with warning)
- Must support force-with-lease push
- Must set upstream branch on first push
- Must emit progress events during push
- Must handle authentication prompts

**FR-7.4: Remote Management**
- Must list all configured remotes
- Must add new remotes
- Must remove remotes
- Must update remote URLs
- Must validate remote URLs

#### 8. Advanced Operations

**FR-8.1: Rebase Operations**
- Must rebase current branch onto another branch
- Must detect rebase conflicts
- Must support interactive rebase
- Must continue rebase after conflict resolution
- Must abort rebase
- Must skip current commit during rebase

**FR-8.2: Stash Operations**
- Must create stash with optional message
- Must list all stashes with metadata
- Must apply stash by index
- Must pop stash (apply and drop)
- Must drop stash by index
- Must create stash including untracked files
- Must show stash diff

**FR-8.3: Cherry-pick Operations**
- Must cherry-pick commit by hash
- Must detect cherry-pick conflicts
- Must continue cherry-pick after resolution
- Must abort cherry-pick

**FR-8.4: Reset Operations**
- Must support soft reset (keep changes staged)
- Must support mixed reset (keep changes unstaged)
- Must support hard reset (discard all changes)
- Must reset to specific commit
- Must prevent accidental data loss (warnings)

**FR-8.5: Tag Operations**
- Must list all tags
- Must create lightweight tags
- Must create annotated tags with message
- Must delete tags
- Must push tags to remote

### Non-Functional Requirements

#### Performance Requirements

**NFR-1: Response Times**
- Repository opening: <500ms for typical repositories
- Commit history (100 commits): <1s
- Diff generation (single file): <200ms
- Diff generation (large commit): <2s for up to 10,000 lines
- Branch listing: <300ms
- Status check: <500ms for repositories with <5,000 files

**NFR-2: Large Repository Support**
- Must handle repositories with 100,000+ commits efficiently
- Must handle repositories with 10,000+ files without freezing
- Must use pagination to avoid loading entire history into memory
- Must stream large diff outputs rather than buffering entirely
- Must implement timeouts for long-running operations (configurable)

**NFR-3: Concurrent Operations**
- Must support multiple repositories open simultaneously (if needed)
- Must handle concurrent read operations safely
- Must block conflicting write operations (e.g., merge during rebase)
- Must use context for cancellation of long operations

**NFR-4: Memory Efficiency**
- Must not load entire repository history into memory
- Must limit diff output size (configurable, default 10MB)
- Must efficiently parse Git command output line-by-line
- Must avoid memory leaks in long-running sessions

#### Reliability Requirements

**NFR-5: Error Handling**
- Must detect Git command failures and parse error messages
- Must provide user-friendly error messages
- Must distinguish between user errors and system errors
- Must recover gracefully from failed operations
- Must validate inputs before executing Git commands
- Must handle Git process crashes

**NFR-6: Data Integrity**
- Must never corrupt Git repositories
- Must validate Git command success before returning
- Must handle partial failures (e.g., network interruption during push)
- Must provide rollback mechanisms for failed operations

**NFR-7: Cross-Platform Compatibility**
- Must work on macOS (primary target)
- Must work on Windows (Git Bash or Git for Windows)
- Must work on Linux
- Must handle platform-specific path separators
- Must handle platform-specific line endings
- Must detect and use correct Git executable path

#### Security Requirements

**NFR-8: Authentication**
- Must support SSH key authentication
- Must support HTTPS credential helpers
- Must never log or expose credentials
- Must use Git's native credential management
- Must handle two-factor authentication prompts

**NFR-9: Input Validation**
- Must sanitize all inputs to Git commands
- Must prevent command injection attacks
- Must validate file paths are within repository
- Must validate commit hashes format
- Must validate branch names format

#### Scalability Requirements

**NFR-10: Resource Management**
- Must limit concurrent Git operations (max 5)
- Must implement operation queuing for resource limits
- Must cancel operations when frontend disconnects
- Must clean up spawned processes on application exit

### API Contract (Go to React)

#### Data Models

**Repository Model**
```go
type Repository struct {
    Path          string   `json:"path"`           // Absolute path to repository
    Name          string   `json:"name"`           // Repository directory name
    CurrentBranch string   `json:"currentBranch"`  // Current branch name or ""
    HeadCommit    string   `json:"headCommit"`     // HEAD commit hash
    IsDirty       bool     `json:"isDirty"`        // Has uncommitted changes
    State         string   `json:"state"`          // "clean", "merging", "rebasing", etc.
    Remotes       []Remote `json:"remotes"`        // Configured remotes
}

type Remote struct {
    Name      string `json:"name"`      // Remote name (e.g., "origin")
    FetchURL  string `json:"fetchUrl"`  // Fetch URL
    PushURL   string `json:"pushUrl"`   // Push URL
}
```

**Commit Model**
```go
type Commit struct {
    Hash             string    `json:"hash"`             // Full commit hash (40 chars)
    AbbrevHash       string    `json:"abbrevHash"`       // Abbreviated hash (7-10 chars)
    Author           Person    `json:"author"`           // Author information
    Committer        Person    `json:"committer"`        // Committer information
    AuthorDate       time.Time `json:"authorDate"`       // When authored
    CommitDate       time.Time `json:"commitDate"`       // When committed
    Subject          string    `json:"subject"`          // First line of message
    Body             string    `json:"body"`             // Rest of message
    Parents          []string  `json:"parents"`          // Parent commit hashes
    FilesChanged     int       `json:"filesChanged"`     // Number of files changed
    Insertions       int       `json:"insertions"`       // Lines added
    Deletions        int       `json:"deletions"`        // Lines removed
    ChangedFiles     []FileChange `json:"changedFiles,omitempty"` // Details (only in GetCommitDetails)
}

type Person struct {
    Name  string `json:"name"`   // Person's name
    Email string `json:"email"`  // Person's email
}

type FileChange struct {
    Path         string `json:"path"`         // File path
    OldPath      string `json:"oldPath"`      // For renames/copies
    Status       string `json:"status"`       // "A", "M", "D", "R", "C"
    Insertions   int    `json:"insertions"`   // Lines added
    Deletions    int    `json:"deletions"`    // Lines removed
    IsBinary     bool   `json:"isBinary"`     // Is binary file
}
```

**Branch Model**
```go
type Branch struct {
    Name         string `json:"name"`         // Branch name
    FullName     string `json:"fullName"`     // refs/heads/main or refs/remotes/origin/main
    IsRemote     bool   `json:"isRemote"`     // Is remote tracking branch
    IsCurrent    bool   `json:"isCurrent"`    // Is currently checked out
    CommitHash   string `json:"commitHash"`   // Last commit on branch
    Upstream     string `json:"upstream"`     // Upstream branch name if tracking
    AheadBy      int    `json:"aheadBy"`      // Commits ahead of upstream
    BehindBy     int    `json:"behindBy"`     // Commits behind upstream
}
```

**Diff Model**
```go
type DiffResult struct {
    Files []FileDiff `json:"files"`  // All changed files
}

type FileDiff struct {
    OldPath     string     `json:"oldPath"`     // Original file path
    NewPath     string     `json:"newPath"`     // New file path (same as old unless renamed)
    Status      string     `json:"status"`      // "A", "M", "D", "R", "C"
    IsBinary    bool       `json:"isBinary"`    // Is binary file
    IsSubmodule bool       `json:"isSubmodule"` // Is submodule change
    Hunks       []DiffHunk `json:"hunks"`       // Diff hunks
}

type DiffHunk struct {
    OldStart int        `json:"oldStart"`  // Starting line in old file
    OldLines int        `json:"oldLines"`  // Number of lines in old file
    NewStart int        `json:"newStart"`  // Starting line in new file
    NewLines int        `json:"newLines"`  // Number of lines in new file
    Header   string     `json:"header"`    // Hunk header (e.g., @@ -1,5 +1,6 @@)
    Lines    []DiffLine `json:"lines"`     // Individual lines
}

type DiffLine struct {
    Type    string `json:"type"`    // "+", "-", " " (context)
    Content string `json:"content"` // Line content
    OldLine int    `json:"oldLine"` // Line number in old file (0 if added)
    NewLine int    `json:"newLine"` // Line number in new file (0 if deleted)
}
```

**Status Model**
```go
type RepoStatus struct {
    Staged      []StatusEntry `json:"staged"`      // Staged changes
    Unstaged    []StatusEntry `json:"unstaged"`    // Unstaged changes
    Untracked   []string      `json:"untracked"`   // Untracked files
    Conflicted  []string      `json:"conflicted"`  // Conflicted files
}

type StatusEntry struct {
    Path    string `json:"path"`    // File path
    OldPath string `json:"oldPath"` // For renames
    Status  string `json:"status"`  // "M", "D", "R", etc.
}
```

**Conflict Model**
```go
type ConflictInfo struct {
    FilePath    string   `json:"filePath"`    // Conflicted file path
    Type        string   `json:"type"`        // "content", "rename", "delete"
    OursVersion string   `json:"oursVersion"` // Our version of content
    TheirVersion string  `json:"theirVersion"` // Their version of content
    BaseVersion string   `json:"baseVersion"` // Common ancestor version
    Markers     []ConflictMarker `json:"markers"` // Conflict marker positions
}

type ConflictMarker struct {
    StartLine int    `json:"startLine"` // Line where conflict starts
    EndLine   int    `json:"endLine"`   // Line where conflict ends
    Type      string `json:"type"`      // "ours" or "theirs"
}
```

**Stash Model**
```go
type Stash struct {
    Index   int       `json:"index"`   // Stash index (0 = most recent)
    Message string    `json:"message"` // Stash message
    Branch  string    `json:"branch"`  // Branch stash was created on
    Date    time.Time `json:"date"`    // When created
}
```

**Tag Model**
```go
type Tag struct {
    Name       string    `json:"name"`       // Tag name
    CommitHash string    `json:"commitHash"` // Commit it points to
    Message    string    `json:"message"`    // Annotation message (if annotated)
    Tagger     Person    `json:"tagger"`     // Who created tag
    Date       time.Time `json:"date"`       // When created
    IsAnnotated bool     `json:"isAnnotated"` // Is annotated tag
}
```

**Error Model**
```go
type GitError struct {
    Code       string `json:"code"`       // Error code (e.g., "CONFLICT", "NOT_FOUND")
    Message    string `json:"message"`    // User-friendly message
    Details    string `json:"details"`    // Technical details
    Stderr     string `json:"stderr"`     // Git stderr output
    Recoverable bool  `json:"recoverable"` // Can user recover from this
}
```

**Progress Model**
```go
type ProgressEvent struct {
    Operation  string `json:"operation"`  // "fetch", "push", "clone", etc.
    Stage      string `json:"stage"`      // Current stage description
    Percent    int    `json:"percent"`    // Progress percentage (0-100)
    Total      int64  `json:"total"`      // Total units (bytes, objects, etc.)
    Current    int64  `json:"current"`    // Current units processed
}
```

#### Service Methods (Wails Bindings)

**RepositoryService**
```go
// Opens a repository and validates it
func (s *RepositoryService) OpenRepository(path string) (*Repository, error)

// Gets current repository information
func (s *RepositoryService) GetRepositoryInfo() (*Repository, error)

// Validates Git installation and version
func (s *RepositoryService) ValidateGitInstallation() (string, error) // Returns Git version

// Gets repository status summary
func (s *RepositoryService) GetStatus() (*RepoStatus, error)
```

**CommitService**
```go
// Gets paginated commit history
func (s *CommitService) GetCommits(limit, offset int) ([]Commit, error)

// Gets commit history for specific branch
func (s *CommitService) GetCommitsByBranch(branch string, limit, offset int) ([]Commit, error)

// Gets full details for a specific commit
func (s *CommitService) GetCommitDetails(hash string) (*Commit, error)

// Searches commits by message
func (s *CommitService) SearchCommits(query string, limit int) ([]Commit, error)

// Filters commits by author
func (s *CommitService) GetCommitsByAuthor(author string, limit, offset int) ([]Commit, error)

// Gets commits in date range
func (s *CommitService) GetCommitsByDateRange(after, before time.Time, limit, offset int) ([]Commit, error)

// Gets commits affecting a specific file
func (s *CommitService) GetCommitsByFile(filePath string, limit, offset int) ([]Commit, error)

// Creates a new commit
func (s *CommitService) CreateCommit(message string) (string, error) // Returns commit hash

// Amends the last commit
func (s *CommitService) AmendCommit(message string) (string, error)
```

**BranchService**
```go
// Lists all branches (local and remote)
func (s *BranchService) ListBranches() ([]Branch, error)

// Lists only local branches
func (s *BranchService) ListLocalBranches() ([]Branch, error)

// Lists only remote branches
func (s *BranchService) ListRemoteBranches() ([]Branch, error)

// Creates a new branch
func (s *BranchService) CreateBranch(name, startPoint string) error

// Deletes a branch
func (s *BranchService) DeleteBranch(name string, force bool) error

// Deletes a remote branch
func (s *BranchService) DeleteRemoteBranch(remote, branch string) error

// Switches to a branch (checkout)
func (s *BranchService) CheckoutBranch(name string) error

// Creates and checks out a new branch
func (s *BranchService) CheckoutNewBranch(name, startPoint string) error

// Renames a branch
func (s *BranchService) RenameBranch(oldName, newName string) error

// Sets upstream tracking branch
func (s *BranchService) SetUpstream(branch, upstream string) error

// Gets current branch info
func (s *BranchService) GetCurrentBranch() (*Branch, error)
```

**DiffService**
```go
// Gets diff for unstaged changes
func (s *DiffService) GetWorkingDiff() (*DiffResult, error)

// Gets diff for staged changes
func (s *DiffService) GetStagedDiff() (*DiffResult, error)

// Gets diff for a specific file (working directory)
func (s *DiffService) GetFileDiff(filePath string, staged bool) (*FileDiff, error)

// Gets diff between two commits
func (s *DiffService) GetCommitDiff(fromHash, toHash string) (*DiffResult, error)

// Gets diff for a single commit (vs parent)
func (s *DiffService) GetCommitChanges(hash string) (*DiffResult, error)

// Gets diff with custom options
func (s *DiffService) GetDiffWithOptions(fromHash, toHash string, options DiffOptions) (*DiffResult, error)

type DiffOptions struct {
    IgnoreWhitespace    bool
    IgnoreWhitespaceEOL bool
    IgnoreAllWhitespace bool
    ContextLines        int
    WordDiff            bool
}
```

**MergeService**
```go
// Merges a branch into current branch
func (s *MergeService) MergeBranch(branch string, noFastForward bool) error

// Checks if merge would create conflicts (dry run)
func (s *MergeService) CheckMergeConflicts(branch string) ([]string, error) // Returns conflicted files

// Gets conflict information for a file
func (s *MergeService) GetConflictInfo(filePath string) (*ConflictInfo, error)

// Lists all conflicted files
func (s *MergeService) ListConflicts() ([]string, error)

// Resolves conflict by accepting a version
func (s *MergeService) ResolveConflict(filePath, resolution string) error // resolution: "ours", "theirs", "both"

// Stages a resolved file
func (s *MergeService) StageResolved(filePath string) error

// Completes merge after conflicts resolved
func (s *MergeService) CompleteMerge(message string) error

// Aborts current merge
func (s *MergeService) AbortMerge() error

// Checks if repository is in merge state
func (s *MergeService) IsInMerge() (bool, error)
```

**StagingService**
```go
// Stages a single file
func (s *StagingService) StageFile(filePath string) error

// Stages multiple files
func (s *StagingService) StageFiles(filePaths []string) error

// Stages all changes
func (s *StagingService) StageAll() error

// Unstages a single file
func (s *StagingService) UnstageFile(filePath string) error

// Unstages multiple files
func (s *StagingService) UnstageFiles(filePaths []string) error

// Unstages all changes
func (s *StagingService) UnstageAll() error

// Discards changes to a file (reset to HEAD)
func (s *StagingService) DiscardChanges(filePath string) error

// Discards all changes
func (s *StagingService) DiscardAllChanges() error
```

**RemoteService**
```go
// Lists all remotes
func (s *RemoteService) ListRemotes() ([]Remote, error)

// Adds a new remote
func (s *RemoteService) AddRemote(name, url string) error

// Removes a remote
func (s *RemoteService) RemoveRemote(name string) error

// Updates remote URL
func (s *RemoteService) UpdateRemoteURL(name, url string) error

// Fetches from remote (emits progress events)
func (s *RemoteService) Fetch(remote string, prune bool) error

// Fetches all remotes
func (s *RemoteService) FetchAll(prune bool) error

// Pulls from upstream (emits progress events)
func (s *RemoteService) Pull(rebase bool) error

// Pushes to remote (emits progress events)
func (s *RemoteService) Push(remote, branch string, force bool) error

// Pushes with setting upstream
func (s *RemoteService) PushSetUpstream(remote, branch string) error

// Pushes tags
func (s *RemoteService) PushTags(remote string) error
```

**RebaseService**
```go
// Rebases current branch onto another branch
func (s *RebaseService) Rebase(onto string) error

// Continues rebase after conflict resolution
func (s *RebaseService) ContinueRebase() error

// Skips current commit during rebase
func (s *RebaseService) SkipRebase() error

// Aborts rebase
func (s *RebaseService) AbortRebase() error

// Checks if repository is in rebase state
func (s *RebaseService) IsInRebase() (bool, error)

// Interactive rebase (advanced)
func (s *RebaseService) InteractiveRebase(onto string, commits []string) error
```

**StashService**
```go
// Creates a stash
func (s *StashService) CreateStash(message string, includeUntracked bool) error

// Lists all stashes
func (s *StashService) ListStashes() ([]Stash, error)

// Applies a stash
func (s *StashService) ApplyStash(index int) error

// Pops a stash (apply and drop)
func (s *StashService) PopStash(index int) error

// Drops a stash
func (s *StashService) DropStash(index int) error

// Clears all stashes
func (s *StashService) ClearStashes() error

// Gets diff for a stash
func (s *StashService) GetStashDiff(index int) (*DiffResult, error)
```

**CherryPickService**
```go
// Cherry-picks a commit
func (s *CherryPickService) CherryPick(commitHash string) error

// Continues cherry-pick after conflict resolution
func (s *CherryPickService) ContinueCherryPick() error

// Aborts cherry-pick
func (s *CherryPickService) AbortCherryPick() error

// Checks if repository is in cherry-pick state
func (s *CherryPickService) IsInCherryPick() (bool, error)
```

**ResetService**
```go
// Soft reset (keep changes staged)
func (s *ResetService) SoftReset(commitHash string) error

// Mixed reset (keep changes unstaged)
func (s *ResetService) MixedReset(commitHash string) error

// Hard reset (discard all changes) - requires confirmation
func (s *ResetService) HardReset(commitHash string) error
```

**TagService**
```go
// Lists all tags
func (s *TagService) ListTags() ([]Tag, error)

// Creates a lightweight tag
func (s *TagService) CreateTag(name, commitHash string) error

// Creates an annotated tag
func (s *TagService) CreateAnnotatedTag(name, message, commitHash string) error

// Deletes a local tag
func (s *TagService) DeleteTag(name string) error

// Deletes a remote tag
func (s *TagService) DeleteRemoteTag(remote, name string) error

// Gets tag details
func (s *TagService) GetTagDetails(name string) (*Tag, error)
```

### Edge Cases

#### 1. Repository State Edge Cases

**EC-1.1: Corrupted Repository**
- **Scenario**: User opens a repository with corrupted Git objects
- **Expected**: Return clear error message indicating corruption, suggest running `git fsck`
- **Handling**: Detect corruption during opening, don't crash application

**EC-1.2: Detached HEAD State**
- **Scenario**: Repository is in detached HEAD state (not on any branch)
- **Expected**: Show HEAD commit hash instead of branch name, allow normal operations
- **Handling**: Handle null branch name gracefully, detect detached state

**EC-1.3: Bare Repository**
- **Scenario**: User tries to open a bare repository (no working directory)
- **Expected**: Return error explaining bare repositories are not supported, or show limited view
- **Handling**: Detect bare repository flag, restrict operations appropriately

**EC-1.4: Submodule Repository**
- **Scenario**: User opens a directory that is a submodule of another repository
- **Expected**: Treat as normal repository, show superproject information if relevant
- **Handling**: Detect `.git` file (not folder) pointing to superproject

**EC-1.5: Worktree**
- **Scenario**: User opens a Git worktree (multiple working directories for one repo)
- **Expected**: Handle as separate repository instance, show worktree info
- **Handling**: Detect worktree configuration, handle shared Git directory

#### 2. Commit History Edge Cases

**EC-2.1: Initial Commit**
- **Scenario**: Repository with only initial commit (no parent)
- **Expected**: Show commit normally, handle empty parents array
- **Handling**: Don't fail when parsing commits with zero parents

**EC-2.2: Orphan Branches**
- **Scenario**: Multiple root commits (unrelated histories)
- **Expected**: Show all commits, handle commits with no common ancestor
- **Handling**: Parse each branch history independently

**EC-2.3: Merge Commits**
- **Scenario**: Commit with multiple parents (merge or octopus merge)
- **Expected**: Show all parents, support diff against each parent
- **Handling**: Parse multiple parent hashes, allow parent selection for diff

**EC-2.4: Empty Repository**
- **Scenario**: Freshly initialized repository with no commits
- **Expected**: Return empty commit list, don't error
- **Handling**: Handle `git log` returning no output gracefully

**EC-2.5: Huge Commit Messages**
- **Scenario**: Commit message exceeding 100KB
- **Expected**: Truncate message with indicator, don't crash
- **Handling**: Limit message parsing to reasonable size

#### 3. Diff Edge Cases

**EC-3.1: Binary Files**
- **Scenario**: Diff includes binary files (images, executables, archives)
- **Expected**: Detect binary files, show "Binary file changed" instead of attempting diff
- **Handling**: Parse "Binary files differ" output from Git

**EC-3.2: Large Files**
- **Scenario**: Diff of file exceeding 10MB
- **Expected**: Warn user, optionally skip diff, don't freeze application
- **Handling**: Check file size before generating diff, implement size limits

**EC-3.3: Renamed Files**
- **Scenario**: File renamed with modifications
- **Expected**: Show rename operation with similarity percentage, show content diff
- **Handling**: Parse `R100` or `R095` status codes, extract old and new paths

**EC-3.4: File Mode Changes**
- **Scenario**: Only executable permission changed (no content change)
- **Expected**: Show mode change (e.g., 644 -> 755), no content diff
- **Handling**: Parse `mode change` in diff output

**EC-3.5: Empty Files**
- **Scenario**: Diff involves empty files (new or deleted empty file)
- **Expected**: Show file operation without content lines
- **Handling**: Handle diffs with zero hunks

**EC-3.6: Line Ending Changes**
- **Scenario**: File changed only line endings (CRLF <-> LF)
- **Expected**: Detect line ending change, optionally show as whitespace change
- **Handling**: Use Git's CRLF handling, provide option to ignore

**EC-3.7: Submodule Changes**
- **Scenario**: Submodule commit pointer changed
- **Expected**: Show submodule path and old/new commit hashes
- **Handling**: Parse submodule special diff format

#### 4. Branch Operation Edge Cases

**EC-4.1: Branch Name Conflicts**
- **Scenario**: User tries to create branch with existing name
- **Expected**: Return error with clear message, suggest alternative name
- **Handling**: Check branch existence before creation

**EC-4.2: Invalid Branch Names**
- **Scenario**: Branch name with invalid characters (.., ~, ^, :, ?, *, [, \, //)
- **Expected**: Validate name, return error with allowed characters
- **Handling**: Use Git's ref name validation rules

**EC-4.3: Checkout with Dirty Working Directory**
- **Scenario**: User tries to switch branches with uncommitted changes that would conflict
- **Expected**: Block checkout, show conflicting files, suggest stashing or committing
- **Handling**: Check working directory status before checkout

**EC-4.4: Delete Current Branch**
- **Scenario**: User tries to delete currently checked out branch
- **Expected**: Return error, cannot delete current branch
- **Handling**: Check if branch is current before deletion

**EC-4.5: Delete Unmerged Branch**
- **Scenario**: User tries to delete branch with unmerged commits
- **Expected**: Warn user, require force flag to confirm deletion
- **Handling**: Check merge status, require explicit confirmation

**EC-4.6: Remote Tracking Branch Mismatch**
- **Scenario**: Local branch has no upstream or upstream is deleted
- **Expected**: Show branch as not tracking, allow setting upstream
- **Handling**: Handle null upstream gracefully, detect stale tracking

#### 5. Merge and Conflict Edge Cases

**EC-5.1: Merge with Conflicts**
- **Scenario**: Merge creates conflicts in multiple files
- **Expected**: Abort automatic merge, list all conflicted files, enter conflict resolution mode
- **Handling**: Detect conflict markers, parse conflicted file list

**EC-5.2: Content Conflicts**
- **Scenario**: Same lines modified in both branches
- **Expected**: Show conflict markers with ours/theirs sections
- **Handling**: Parse `<<<<<<<`, `=======`, `>>>>>>>` markers

**EC-5.3: Rename Conflicts**
- **Scenario**: File renamed differently in both branches
- **Expected**: Show both rename operations, allow user to choose
- **Handling**: Detect rename/rename conflicts, present both paths

**EC-5.4: Delete Conflicts**
- **Scenario**: File modified in one branch, deleted in other
- **Expected**: Show modify/delete conflict, allow keeping or deleting
- **Handling**: Detect DU or UD status codes

**EC-5.5: Binary Conflicts**
- **Scenario**: Binary file changed in both branches
- **Expected**: Cannot auto-merge, require user to choose version
- **Handling**: Detect binary conflicts, offer ours/theirs selection

**EC-5.6: Fast-Forward Merges**
- **Scenario**: Target branch is direct ancestor (no divergence)
- **Expected**: Perform fast-forward by default, create merge commit if requested
- **Handling**: Detect fast-forward possibility, respect no-fast-forward flag

**EC-5.7: Already Up-to-Date**
- **Scenario**: Merge when current branch already includes target branch
- **Expected**: Return success with message "Already up to date"
- **Handling**: Detect up-to-date status, don't create unnecessary commit

#### 6. Remote Operation Edge Cases

**EC-6.1: Network Timeout**
- **Scenario**: Fetch/pull/push times out due to network issues
- **Expected**: Return timeout error, allow retry, don't corrupt repository state
- **Handling**: Implement timeouts, detect network errors from Git

**EC-6.2: Authentication Failure**
- **Scenario**: HTTPS credentials invalid or SSH key not authorized
- **Expected**: Return authentication error, prompt for credentials or show SSH key issues
- **Handling**: Parse Git authentication errors, detect credential helper issues

**EC-6.3: Push Rejected (Non-Fast-Forward)**
- **Scenario**: Push rejected because remote has commits not in local
- **Expected**: Return error, suggest pulling first, show diverged status
- **Handling**: Detect "non-fast-forward" error, guide user to resolve

**EC-6.4: Force Push to Protected Branch**
- **Scenario**: User tries to force push to main/master or protected branch
- **Expected**: Warn strongly, require explicit confirmation, prevent accidental data loss
- **Handling**: Detect protected branch patterns, implement confirmation dialog

**EC-6.5: Large Push/Pull**
- **Scenario**: Pushing/pulling gigabytes of data
- **Expected**: Show progress with percentage and transfer rate, allow cancellation
- **Handling**: Parse Git progress output, emit progress events

**EC-6.6: Remote Branch Deleted**
- **Scenario**: Remote tracking branch references deleted remote branch
- **Expected**: Show stale branch, allow pruning, suggest fetch with prune
- **Handling**: Detect stale references, implement pruning

**EC-6.7: Conflicting Remote URLs**
- **Scenario**: Fetch and push URLs are different for same remote
- **Expected**: Show both URLs, allow operations on each
- **Handling**: Parse separate fetch/push URLs from config

#### 7. Staging and Status Edge Cases

**EC-7.1: File Staged and Modified**
- **Scenario**: File has both staged and unstaged changes
- **Expected**: Show file in both staged and unstaged lists with different diffs
- **Handling**: Parse `MM` status code, generate separate diffs for index and working tree

**EC-7.2: Untracked Directory**
- **Scenario**: Entire directory is untracked
- **Expected**: Show directory in untracked list, allow staging entire directory
- **Handling**: Handle directory paths in status output

**EC-7.3: Ignored Files**
- **Scenario**: Files matching .gitignore patterns
- **Expected**: Don't show in status by default, allow showing with flag
- **Handling**: Respect Git's ignore rules, provide option to show ignored

**EC-7.4: Typechange**
- **Scenario**: File changed type (regular file <-> symlink)
- **Expected**: Show as typechange operation
- **Handling**: Parse `T` status code, show old and new types

**EC-7.5: Partially Staged File**
- **Scenario**: User staged hunks but not entire file (interactive staging)
- **Expected**: Show complex staged/unstaged state accurately
- **Handling**: Track per-hunk staging state

#### 8. Advanced Operation Edge Cases

**EC-8.1: Rebase Conflicts**
- **Scenario**: Rebase encounters conflicts
- **Expected**: Pause rebase, show conflicted files, allow continue/skip/abort
- **Handling**: Detect rebase state in `.git/rebase-merge`, handle continuation

**EC-8.2: Interactive Rebase**
- **Scenario**: User wants to reorder, squash, or edit commits
- **Expected**: Provide UI for rebase plan, execute interactive rebase
- **Handling**: Generate rebase todo file, handle Git editor interaction

**EC-8.3: Stash with Untracked Files**
- **Scenario**: Stash includes untracked files
- **Expected**: Save and restore untracked files with stash
- **Handling**: Use `--include-untracked` flag, handle in stash apply

**EC-8.4: Stash Conflicts on Apply**
- **Scenario**: Applying stash creates conflicts
- **Expected**: Show conflicts, enter conflict resolution mode
- **Handling**: Detect stash apply conflicts, allow resolution

**EC-8.5: Cherry-Pick Already Applied**
- **Scenario**: Cherry-picking commit that is already in history
- **Expected**: Detect empty cherry-pick, allow skipping
- **Handling**: Handle empty commits from cherry-pick

**EC-8.6: Hard Reset Confirmation**
- **Scenario**: User requests hard reset (will lose uncommitted work)
- **Expected**: Show strong warning, require explicit confirmation, prevent accidental data loss
- **Handling**: Implement confirmation dialog, check for uncommitted changes

**EC-8.7: Tag Name Conflicts**
- **Scenario**: Tag name conflicts with branch name
- **Expected**: Allow both, disambiguate in commands (refs/tags/name vs refs/heads/name)
- **Handling**: Use full ref names when ambiguous

#### 9. Performance Edge Cases

**EC-9.1: Huge Repository**
- **Scenario**: Repository with 500,000+ commits and 50,000+ files
- **Expected**: Load commits on demand with pagination, don't freeze UI
- **Handling**: Implement strict pagination, limit initial data load

**EC-9.2: Large Diff (>100K lines)**
- **Scenario**: Commit changes 10,000 lines across 500 files
- **Expected**: Warn user, offer to limit diff display, implement virtualization
- **Handling**: Limit diff size, allow expanding on demand

**EC-9.3: Long-Running Operations**
- **Scenario**: Clone, fetch, or rebase takes >5 minutes
- **Expected**: Show progress continuously, allow cancellation, don't block other operations
- **Handling**: Implement context cancellation, emit progress events

**EC-9.4: File System Watchers**
- **Scenario**: External changes to repository (IDE making commits, command line operations)
- **Expected**: Detect changes, refresh UI automatically or show notification
- **Handling**: Implement file watching on `.git` directory (future enhancement)

#### 10. Cross-Platform Edge Cases

**EC-10.1: Windows Path Separators**
- **Scenario**: File paths with backslashes on Windows
- **Expected**: Normalize paths to forward slashes for Git commands
- **Handling**: Convert paths before passing to Git, convert back for display

**EC-10.2: Case-Insensitive File Systems**
- **Scenario**: macOS/Windows with case-insensitive file systems
- **Expected**: Handle files that differ only in case correctly
- **Handling**: Use Git's case-sensitivity settings, don't create conflicts

**EC-10.3: Line Ending Differences**
- **Scenario**: CRLF on Windows, LF on Unix
- **Expected**: Respect `.gitattributes` and `core.autocrlf` settings
- **Handling**: Let Git handle line ending conversion

**EC-10.4: Git Executable Location**
- **Scenario**: Git installed in non-standard location
- **Expected**: Auto-detect Git location or allow user configuration
- **Handling**: Check PATH, common installation directories, registry (Windows)

**EC-10.5: Permission Issues**
- **Scenario**: Repository or files lack read/write permissions
- **Expected**: Return clear permission errors, don't crash
- **Handling**: Check file permissions, handle OS-level errors gracefully

## Acceptance Criteria

### Core Functionality

**AC-1: Repository Operations**
- [ ] Can open valid Git repositories
- [ ] Rejects non-Git directories with clear error
- [ ] Shows repository status (branch, dirty state, remotes)
- [ ] Handles detached HEAD state
- [ ] Validates Git installation on startup

**AC-2: Commit History**
- [ ] Loads 100 commits in under 1 second
- [ ] Paginates through 100,000+ commits without memory issues
- [ ] Displays all commit metadata accurately
- [ ] Shows merge commits with multiple parents
- [ ] Filters commits by branch, author, date, and message

**AC-3: Diff Generation**
- [ ] Generates diffs for working directory changes
- [ ] Generates diffs for staged changes
- [ ] Generates diffs between any two commits
- [ ] Detects and handles binary files
- [ ] Detects and displays renamed files
- [ ] Handles diffs up to 10,000 lines in under 2 seconds

**AC-4: Branch Operations**
- [ ] Lists all local and remote branches
- [ ] Creates new branches
- [ ] Deletes branches with safety checks
- [ ] Switches branches (checkout)
- [ ] Blocks checkout with conflicting uncommitted changes
- [ ] Shows ahead/behind status for tracking branches

**AC-5: Staging and Committing**
- [ ] Stages individual files and all files
- [ ] Unstages files
- [ ] Creates commits with messages
- [ ] Amends last commit
- [ ] Shows separate diffs for staged and unstaged changes

**AC-6: Merge Operations**
- [ ] Merges branches successfully
- [ ] Detects merge conflicts
- [ ] Lists conflicted files
- [ ] Parses conflict markers
- [ ] Completes merge after conflict resolution
- [ ] Aborts merge cleanly

**AC-7: Remote Operations**
- [ ] Fetches from remotes with progress reporting
- [ ] Pulls with merge or rebase strategy
- [ ] Pushes commits with progress reporting
- [ ] Handles authentication errors gracefully
- [ ] Detects network timeouts and reports clearly

**AC-8: Advanced Operations**
- [ ] Performs rebase with conflict handling
- [ ] Creates and applies stashes
- [ ] Cherry-picks commits
- [ ] Performs soft, mixed, and hard resets with warnings
- [ ] Creates and deletes tags

### Error Handling

**AC-9: Error Detection**
- [ ] Detects corrupted repositories
- [ ] Detects invalid Git commands
- [ ] Detects conflicts and blocks operations
- [ ] Detects network failures
- [ ] Detects authentication failures
- [ ] Provides user-friendly error messages for all failures

**AC-10: Data Safety**
- [ ] Never corrupts Git repositories
- [ ] Warns before destructive operations (hard reset, force push)
- [ ] Validates all inputs before executing Git commands
- [ ] Prevents command injection attacks
- [ ] Handles Git command failures gracefully

### Performance

**AC-11: Response Times**
- [ ] Repository opening: <500ms
- [ ] Commit history (100 commits): <1s
- [ ] Single file diff: <200ms
- [ ] Branch listing: <300ms
- [ ] Status check: <500ms

**AC-12: Resource Usage**
- [ ] Memory usage stays under 500MB for typical operations
- [ ] No memory leaks during long sessions
- [ ] Concurrent operations limited to 5
- [ ] Long operations can be cancelled

### Cross-Platform

**AC-13: Platform Compatibility**
- [ ] Works on macOS 10.15+
- [ ] Works on Windows 10+
- [ ] Works on Linux (Ubuntu 20.04+)
- [ ] Handles platform-specific path separators
- [ ] Handles platform-specific line endings
- [ ] Detects Git executable on all platforms

## Business Rules

**BR-1: Git Version Requirement**
- Minimum Git version: 2.30.0
- Check version on application startup
- Display warning if version is outdated

**BR-2: Operation Safety**
- All destructive operations (hard reset, force push, branch deletion) require explicit confirmation
- Operations that would lose uncommitted work must warn user
- Cannot delete currently checked-out branch
- Cannot push to protected branches (main, master) without confirmation

**BR-3: Resource Limits**
- Maximum concurrent Git operations: 5
- Maximum diff size: 10MB (configurable)
- Maximum commit message size: 100KB
- Operation timeout: 5 minutes (configurable)
- Pagination default: 100 commits

**BR-4: Authentication**
- Use Git's native credential helpers
- Support SSH key authentication
- Support HTTPS token authentication
- Never log or expose credentials in errors or logs

**BR-5: Repository State Management**
- Block conflicting operations (e.g., merge during rebase)
- Maintain single source of truth for repository state
- Detect external changes to repository (if possible)
- Handle concurrent modifications gracefully

**BR-6: Error Classification**
- User errors (invalid input, conflicts): Recoverable, user can fix
- System errors (permissions, disk full): May require external fix
- Git errors (corrupted repo): May require manual Git commands
- Network errors (timeout, auth): Retry or check connection

## Open Questions

**Q-1**: Should we support shallow clones (--depth) for large repositories?
**Q-2**: Should we implement file system watching to detect external changes?
**Q-3**: Should we support Git LFS (Large File Storage)?
**Q-4**: Should we support sparse checkouts for monorepos?
**Q-5**: How should we handle Git hooks? Execute them, skip them, or ask user?
**Q-6**: Should we support interactive rebase through UI or delegate to Git's editor?
**Q-7**: Should we support GPG signing of commits and tags?
**Q-8**: Should we implement custom merge tools or use Git's configured tool?
**Q-9**: Should we cache parsed Git output in memory or always fetch fresh?
**Q-10**: Should we support multiple repositories open in tabs/windows?

## Success Metrics

**User Experience Metrics**:
- Time to open repository: <500ms
- Time to view commit history: <1s
- Time to view diff: <200ms
- Zero Git repository corruption incidents
- Error messages understood by 90% of users

**Performance Metrics**:
- Support repositories with 100,000+ commits
- Support repositories with 10,000+ files
- Memory usage <500MB for typical operations
- CPU usage <20% during idle
- All operations respond within timeout limits

**Reliability Metrics**:
- 99.9% operation success rate (excluding user errors and network issues)
- Zero crashes due to Git command failures
- 100% input validation coverage
- Zero command injection vulnerabilities

## References

**Git Documentation**:
- Git Command Reference: https://git-scm.com/docs
- Git Internals: https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain
- Git Data Format: https://git-scm.com/docs/git-log#_pretty_formats

**Similar Tools**:
- JetBrains IDE Git Integration (reference implementation)
- SourceTree (Git GUI)
- GitKraken (Git GUI)
- GitHub Desktop

**Wails Documentation**:
- Wails v2 Docs: https://wails.io/docs/introduction
- Wails Bindings: https://wails.io/docs/howdoesitwork
- Wails Events: https://wails.io/docs/reference/runtime/events

**Security**:
- OWASP Command Injection: https://owasp.org/www-community/attacks/Command_Injection
- Git Security Best Practices: https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery
