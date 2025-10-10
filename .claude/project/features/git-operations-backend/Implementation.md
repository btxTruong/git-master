# Implementation Plan: Git Operations Backend

## Technology Stack

### Language and Runtime
- **Go 1.21+**
  - Justification: Cross-platform support, excellent concurrency, native performance, strong standard library
  - Strong typing prevents runtime errors
  - Built-in testing framework
  - Easy integration with Wails

### Framework
- **Wails v2**
  - Justification: Purpose-built for Go + Web frontend desktop apps
  - Automatic binding generation for Go methods
  - Built-in event system for progress reporting
  - Cross-platform window management
  - Development hot reload

### Git Integration
- **os/exec with native Git**
  - Justification: Maximum compatibility with all Git features (matches JetBrains approach)
  - Proven reliability for complex operations (merge, rebase, submodules)
  - No library maintenance burden, works with any Git version
  - Access to latest Git features immediately
  - Industry-standard approach for Git GUI tools

### Core Libraries
- **Standard Library**
  - `os/exec`: Command execution
  - `encoding/json`: Data serialization
  - `context`: Cancellation and timeouts
  - `bufio`: Stream parsing
  - `regexp`: Output parsing
  - `time`: Date/time handling
  - `path/filepath`: Cross-platform path handling
  - `errors`: Error wrapping and handling

- **Third-Party Libraries** (minimal)
  - `github.com/wailsapp/wails/v2/pkg/runtime`: Wails bindings and events (required)
  - Consider: `github.com/go-playground/validator/v10` for input validation (optional)

### Testing Stack
- **Standard testing package**: Unit tests
- **testify/assert**: Assertion helpers (optional but recommended)
- **Real Git repositories**: Integration tests with actual Git commands
- **Test fixtures**: Sample repositories with known states

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Wails Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              React Frontend (TypeScript)                   │  │
│  │  - Zustand stores                                          │  │
│  │  - UI components                                           │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│                              │ JSON-RPC                          │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │              Wails Binding Layer                           │  │
│  │  - Auto-generated bindings                                 │  │
│  │  - Type conversion (Go ↔ JSON ↔ TS)                       │  │
│  │  - Event emission                                          │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │                   Service Layer (Go)                       │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐              │  │
│  │  │ RepositoryService│  │  CommitService   │              │  │
│  │  └────────┬─────────┘  └────────┬─────────┘              │  │
│  │           │                     │                         │  │
│  │  ┌────────▼─────────┐  ┌───────▼──────────┐              │  │
│  │  │  BranchService   │  │   DiffService    │              │  │
│  │  └────────┬─────────┘  └───────┬──────────┘              │  │
│  │           │                     │                         │  │
│  │  ┌────────▼─────────┐  ┌───────▼──────────┐              │  │
│  │  │  MergeService    │  │  StagingService  │              │  │
│  │  └────────┬─────────┘  └───────┬──────────┘              │  │
│  │           │                     │                         │  │
│  │  ┌────────▼─────────┐  ┌───────▼──────────┐              │  │
│  │  │  RemoteService   │  │  RebaseService   │              │  │
│  │  └────────┬─────────┘  └───────┬──────────┘              │  │
│  │           │                     │                         │  │
│  │  ┌────────▼─────────┐  ┌───────▼──────────┐              │  │
│  │  │  StashService    │  │ CherryPickService│              │  │
│  │  └────────┬─────────┘  └───────┬──────────┘              │  │
│  │           │                     │                         │  │
│  │  ┌────────▼─────────┐  ┌───────▼──────────┐              │  │
│  │  │  ResetService    │  │   TagService     │              │  │
│  │  └────────┬─────────┘  └───────┬──────────┘              │  │
│  │           │                     │                         │  │
│  │           └──────────┬──────────┘                         │  │
│  │                      │                                    │  │
│  │           ┌──────────▼──────────┐                         │  │
│  │           │   GitExecutor       │                         │  │
│  │           │  - Command building │                         │  │
│  │           │  - Process spawning │                         │  │
│  │           │  - Stream handling  │                         │  │
│  │           │  - Error parsing    │                         │  │
│  │           └──────────┬──────────┘                         │  │
│  │                      │                                    │  │
│  │           ┌──────────▼──────────┐                         │  │
│  │           │    GitParser        │                         │  │
│  │           │  - Log parsing      │                         │  │
│  │           │  - Diff parsing     │                         │  │
│  │           │  - Status parsing   │                         │  │
│  │           │  - Branch parsing   │                         │  │
│  │           └─────────────────────┘                         │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ os/exec                           │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │                Native Git Commands                         │  │
│  │  git log, git diff, git branch, git merge, etc.           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### 1. Repository Pattern (Implicit)
**Usage**: Each service acts as a repository for Git operations
**Rationale**:
- Encapsulates Git command execution details
- Provides clean interface to frontend
- Easy to mock for testing
- Separates concerns (business logic vs Git commands)

#### 2. Singleton Pattern (Application Context)
**Usage**: Single App struct holds all services and shared state
**Rationale**:
- Wails requires single struct with bound methods
- Shared repository path across services
- Centralized event emission
- Simplified dependency injection

**Implementation**:
```go
type App struct {
    ctx              context.Context
    repoPath         string
    executor         *git.Executor
    repositoryService *services.RepositoryService
    commitService    *services.CommitService
    // ... other services
}
```

#### 3. Strategy Pattern (Diff Options)
**Usage**: Different diff algorithms and options
**Rationale**:
- Flexible diff generation (ignore whitespace, word diff, patience algorithm)
- Easy to add new diff strategies
- Clean separation of configuration from execution

#### 4. Builder Pattern (Git Command Construction)
**Usage**: Constructing complex Git commands with multiple flags
**Rationale**:
- Git commands can have many optional flags
- Improves readability vs string concatenation
- Type-safe command construction
- Easy to test

**Implementation**:
```go
type CommandBuilder struct {
    args []string
}

func (b *CommandBuilder) Add(arg string) *CommandBuilder {
    b.args = append(b.args, arg)
    return b
}

func (b *CommandBuilder) AddIf(condition bool, arg string) *CommandBuilder {
    if condition {
        b.args = append(b.args, arg)
    }
    return b
}

func (b *CommandBuilder) Build() []string {
    return b.args
}
```

#### 5. Observer Pattern (Event System)
**Usage**: Progress reporting for long-running operations
**Rationale**:
- Decouples backend from frontend updates
- Allows multiple listeners
- Non-blocking progress updates
- Built into Wails runtime

**Implementation**:
```go
// Emit progress event
runtime.EventsEmit(ctx, "git:progress", ProgressEvent{
    Operation: "fetch",
    Percent:   50,
    Stage:     "Receiving objects",
})
```

#### 6. Factory Pattern (Parser Selection)
**Usage**: Creating appropriate parser for Git output
**Rationale**:
- Different Git commands have different output formats
- Centralized parser creation
- Easy to extend with new parsers

#### 7. Template Method Pattern (Git Operation Flow)
**Usage**: Standard flow for Git operations (validate → execute → parse → return)
**Rationale**:
- Consistent error handling across operations
- Centralized logging and monitoring
- Reduces code duplication

### Directory Structure

```
backend/
├── models/
│   ├── commit.go           # Commit, Person, FileChange structs
│   ├── branch.go           # Branch struct
│   ├── diff.go             # DiffResult, FileDiff, DiffHunk, DiffLine structs
│   ├── repository.go       # Repository, Remote structs
│   ├── status.go           # RepoStatus, StatusEntry structs
│   ├── conflict.go         # ConflictInfo, ConflictMarker structs
│   ├── stash.go            # Stash struct
│   ├── tag.go              # Tag struct
│   ├── progress.go         # ProgressEvent struct
│   └── error.go            # GitError struct with error codes
│
├── git/
│   ├── executor.go         # GitExecutor struct - command execution
│   ├── parser.go           # GitParser interface and implementations
│   ├── log_parser.go       # ParseCommitLog function
│   ├── diff_parser.go      # ParseDiff function
│   ├── status_parser.go    # ParseStatus function
│   ├── branch_parser.go    # ParseBranches function
│   ├── progress_parser.go  # ParseProgress function (for push/pull/fetch)
│   ├── conflict_parser.go  # ParseConflicts function
│   ├── command_builder.go  # CommandBuilder for constructing Git commands
│   └── validator.go        # Input validation utilities
│
├── services/
│   ├── repository_service.go   # Repository operations
│   ├── commit_service.go       # Commit history and details
│   ├── branch_service.go       # Branch operations
│   ├── diff_service.go         # Diff generation
│   ├── merge_service.go        # Merge operations
│   ├── staging_service.go      # Staging and unstaging
│   ├── remote_service.go       # Remote operations
│   ├── rebase_service.go       # Rebase operations
│   ├── stash_service.go        # Stash operations
│   ├── cherrypick_service.go   # Cherry-pick operations
│   ├── reset_service.go        # Reset operations
│   └── tag_service.go          # Tag operations
│
├── app.go                  # Main App struct with Wails bindings
└── main.go                 # Application entry point
```

### Database Schema

**Not Applicable**: This application does not use a database. All data is read directly from Git repositories via Git commands. State is ephemeral and lives in memory during application runtime.

### API Design

**Internal API** (Go services - not exposed directly):

The internal API consists of Go methods on service structs. These are internal implementations called by the public Wails-bound methods.

**Public API** (Wails bindings - exposed to React):

All public methods are defined in PRD.md under "Service Methods". These are bound to the React frontend via Wails' automatic binding system.

**API Conventions**:
1. All methods return `(result, error)` tuple
2. All methods accept `context.Context` as first parameter (for cancellation)
3. All structs are JSON-serializable
4. All timestamps use `time.Time` (converted to ISO 8601 strings in JSON)
5. All file paths are absolute and use forward slashes
6. All errors are wrapped with context using `fmt.Errorf("context: %w", err)`

### Git Command Execution Strategy

#### Core Executor Design

**GitExecutor Struct**:
```go
type Executor struct {
    repoPath      string
    gitPath       string
    ctx           context.Context
    maxConcurrent int
    semaphore     chan struct{}
}

func NewExecutor(ctx context.Context, repoPath string) (*Executor, error) {
    gitPath, err := exec.LookPath("git")
    if err != nil {
        return nil, fmt.Errorf("git not found in PATH: %w", err)
    }

    return &Executor{
        repoPath:      repoPath,
        gitPath:       gitPath,
        ctx:           ctx,
        maxConcurrent: 5,
        semaphore:     make(chan struct{}, 5),
    }, nil
}
```

#### Command Execution Flow

**Standard Execution**:
```go
func (e *Executor) Execute(args ...string) (*ExecResult, error) {
    // Acquire semaphore slot
    e.semaphore <- struct{}{}
    defer func() { <-e.semaphore }()

    // Build command
    cmd := exec.CommandContext(e.ctx, e.gitPath, args...)
    cmd.Dir = e.repoPath

    // Set environment
    cmd.Env = append(os.Environ(),
        "GIT_TERMINAL_PROMPT=0",  // Disable interactive prompts
        "LANG=C",                  // Ensure English output for parsing
    )

    // Capture output
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr

    // Execute
    err := cmd.Run()

    result := &ExecResult{
        Stdout:   stdout.String(),
        Stderr:   stderr.String(),
        ExitCode: cmd.ProcessState.ExitCode(),
    }

    // Check for errors
    if err != nil {
        return result, e.parseError(result)
    }

    return result, nil
}

type ExecResult struct {
    Stdout   string
    Stderr   string
    ExitCode int
}
```

**Streaming Execution** (for large outputs and progress):
```go
func (e *Executor) ExecuteStreaming(args ...string, handler OutputHandler) error {
    e.semaphore <- struct{}{}
    defer func() { <-e.semaphore }()

    cmd := exec.CommandContext(e.ctx, e.gitPath, args...)
    cmd.Dir = e.repoPath
    cmd.Env = append(os.Environ(), "GIT_TERMINAL_PROMPT=0", "LANG=C")

    // Create pipes
    stdout, _ := cmd.StdoutPipe()
    stderr, _ := cmd.StderrPipe()

    // Start command
    if err := cmd.Start(); err != nil {
        return err
    }

    // Stream stdout
    go func() {
        scanner := bufio.NewScanner(stdout)
        for scanner.Scan() {
            handler.HandleStdout(scanner.Text())
        }
    }()

    // Stream stderr (progress info)
    go func() {
        scanner := bufio.NewScanner(stderr)
        for scanner.Scan() {
            handler.HandleStderr(scanner.Text())
        }
    }()

    // Wait for completion
    return cmd.Wait()
}

type OutputHandler interface {
    HandleStdout(line string)
    HandleStderr(line string)
}
```

#### Command Categories

**1. Read Operations** (fast, no side effects):
- `git log`
- `git show`
- `git diff`
- `git branch --list`
- `git status`
- `git ls-files`

**2. Write Operations** (modify repository):
- `git add`
- `git commit`
- `git branch` (create/delete)
- `git checkout`
- `git merge`
- `git rebase`
- `git reset`

**3. Network Operations** (slow, need progress):
- `git fetch`
- `git pull`
- `git push`
- `git clone`

### Git Command Parsing Strategies

#### 1. Commit Log Parsing

**Git Command**:
```bash
git log \
    --pretty=format:'%H%x00%h%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%ct%x00%s%x00%b%x00%P%x00' \
    --numstat \
    --no-renames \
    -n <limit> \
    --skip=<offset>
```

**Format Explanation**:
- `%H`: Full commit hash
- `%h`: Abbreviated hash
- `%an`: Author name
- `%ae`: Author email
- `%cn`: Committer name
- `%ce`: Committer email
- `%at`: Author timestamp (Unix)
- `%ct`: Commit timestamp (Unix)
- `%s`: Subject (first line of message)
- `%b`: Body (rest of message)
- `%P`: Parent hashes (space-separated)
- `%x00`: NULL delimiter (unambiguous)
- `--numstat`: Show file statistics

**Parser Implementation**:
```go
func ParseCommitLog(output string) ([]models.Commit, error) {
    commits := []models.Commit{}

    // Split by double newline (commit separator)
    commitBlocks := strings.Split(output, "\n\n")

    for _, block := range commitBlocks {
        lines := strings.Split(block, "\n")
        if len(lines) < 1 {
            continue
        }

        // Parse header line (NULL-delimited)
        parts := strings.Split(lines[0], "\x00")
        if len(parts) < 11 {
            continue
        }

        authorTime, _ := strconv.ParseInt(parts[6], 10, 64)
        commitTime, _ := strconv.ParseInt(parts[7], 10, 64)

        commit := models.Commit{
            Hash:       parts[0],
            AbbrevHash: parts[1],
            Author: models.Person{
                Name:  parts[2],
                Email: parts[3],
            },
            Committer: models.Person{
                Name:  parts[4],
                Email: parts[5],
            },
            AuthorDate: time.Unix(authorTime, 0),
            CommitDate: time.Unix(commitTime, 0),
            Subject:    parts[8],
            Body:       parts[9],
            Parents:    strings.Fields(parts[10]),
        }

        // Parse numstat lines (file statistics)
        for i := 1; i < len(lines); i++ {
            statParts := strings.Fields(lines[i])
            if len(statParts) >= 3 {
                insertions, _ := strconv.Atoi(statParts[0])
                deletions, _ := strconv.Atoi(statParts[1])

                commit.Insertions += insertions
                commit.Deletions += deletions
                commit.FilesChanged++
            }
        }

        commits = append(commits, commit)
    }

    return commits, nil
}
```

#### 2. Diff Parsing

**Git Command**:
```bash
git diff \
    --unified=3 \
    --no-color \
    --no-ext-diff \
    --patch \
    --full-index \
    <from> <to> \
    [--ignore-space-change] \
    [--ignore-all-space]
```

**Diff Format** (Unified Diff):
```
diff --git a/file.go b/file.go
index 1234567..abcdefg 100644
--- a/file.go
+++ b/file.go
@@ -10,7 +10,8 @@ package main

 context line
-removed line
+added line
 context line
```

**Parser Implementation**:
```go
func ParseDiff(output string) (*models.DiffResult, error) {
    result := &models.DiffResult{
        Files: []models.FileDiff{},
    }

    // State machine for parsing
    var currentFile *models.FileDiff
    var currentHunk *models.DiffHunk
    oldLineNum := 0
    newLineNum := 0

    lines := strings.Split(output, "\n")

    for _, line := range lines {
        switch {
        case strings.HasPrefix(line, "diff --git"):
            // New file
            if currentFile != nil {
                result.Files = append(result.Files, *currentFile)
            }
            currentFile = &models.FileDiff{}

        case strings.HasPrefix(line, "---"):
            // Old file path
            currentFile.OldPath = parseFilePath(line[4:])

        case strings.HasPrefix(line, "+++"):
            // New file path
            currentFile.NewPath = parseFilePath(line[4:])

        case strings.HasPrefix(line, "@@"):
            // Hunk header: @@ -10,7 +10,8 @@
            if currentHunk != nil {
                currentFile.Hunks = append(currentFile.Hunks, *currentHunk)
            }

            currentHunk = parseHunkHeader(line)
            oldLineNum = currentHunk.OldStart
            newLineNum = currentHunk.NewStart

        case len(line) > 0 && (line[0] == ' ' || line[0] == '+' || line[0] == '-'):
            // Diff line
            diffLine := models.DiffLine{
                Type:    string(line[0]),
                Content: line[1:],
            }

            if line[0] == ' ' {
                diffLine.OldLine = oldLineNum
                diffLine.NewLine = newLineNum
                oldLineNum++
                newLineNum++
            } else if line[0] == '-' {
                diffLine.OldLine = oldLineNum
                oldLineNum++
            } else if line[0] == '+' {
                diffLine.NewLine = newLineNum
                newLineNum++
            }

            currentHunk.Lines = append(currentHunk.Lines, diffLine)

        case strings.Contains(line, "Binary files"):
            // Binary file
            currentFile.IsBinary = true
        }
    }

    // Add last file and hunk
    if currentHunk != nil {
        currentFile.Hunks = append(currentFile.Hunks, *currentHunk)
    }
    if currentFile != nil {
        result.Files = append(result.Files, *currentFile)
    }

    return result, nil
}

func parseHunkHeader(line string) *models.DiffHunk {
    // Parse: @@ -10,7 +10,8 @@ optional context
    re := regexp.MustCompile(`@@ -(\d+),(\d+) \+(\d+),(\d+) @@(.*)`)
    matches := re.FindStringSubmatch(line)

    if len(matches) < 5 {
        return &models.DiffHunk{}
    }

    oldStart, _ := strconv.Atoi(matches[1])
    oldLines, _ := strconv.Atoi(matches[2])
    newStart, _ := strconv.Atoi(matches[3])
    newLines, _ := strconv.Atoi(matches[4])

    return &models.DiffHunk{
        OldStart: oldStart,
        OldLines: oldLines,
        NewStart: newStart,
        NewLines: newLines,
        Header:   line,
        Lines:    []models.DiffLine{},
    }
}

func parseFilePath(path string) string {
    // Remove a/ or b/ prefix and handle quotes
    path = strings.TrimSpace(path)
    if strings.HasPrefix(path, "a/") || strings.HasPrefix(path, "b/") {
        path = path[2:]
    }
    // Handle quoted paths with spaces
    path = strings.Trim(path, "\"")
    return path
}
```

#### 3. Status Parsing

**Git Command**:
```bash
git status --porcelain=v1 -z
```

**Format** (Porcelain v1):
```
M  file.go         # Modified in index
 M file.go         # Modified in working tree
MM file.go         # Modified in both
A  file.go         # Added to index
?? file.go         # Untracked
UU file.go         # Conflicted (both modified)
R  old.go -> new.go  # Renamed
```

**Parser Implementation**:
```go
func ParseStatus(output string) (*models.RepoStatus, error) {
    status := &models.RepoStatus{
        Staged:     []models.StatusEntry{},
        Unstaged:   []models.StatusEntry{},
        Untracked:  []string{},
        Conflicted: []string{},
    }

    // Split by null character (with -z flag)
    entries := strings.Split(output, "\x00")

    for _, entry := range entries {
        if len(entry) < 3 {
            continue
        }

        indexStatus := entry[0]
        workTreeStatus := entry[1]
        path := entry[3:]

        // Handle renames (path contains " -> ")
        var oldPath string
        if strings.Contains(path, " -> ") {
            parts := strings.Split(path, " -> ")
            oldPath = parts[0]
            path = parts[1]
        }

        // Conflict detection
        if indexStatus == 'U' || workTreeStatus == 'U' {
            status.Conflicted = append(status.Conflicted, path)
            continue
        }

        // Staged changes
        if indexStatus != ' ' && indexStatus != '?' {
            status.Staged = append(status.Staged, models.StatusEntry{
                Path:    path,
                OldPath: oldPath,
                Status:  string(indexStatus),
            })
        }

        // Unstaged changes
        if workTreeStatus != ' ' && workTreeStatus != '?' {
            status.Unstaged = append(status.Unstaged, models.StatusEntry{
                Path:   path,
                Status: string(workTreeStatus),
            })
        }

        // Untracked files
        if indexStatus == '?' && workTreeStatus == '?' {
            status.Untracked = append(status.Untracked, path)
        }
    }

    return status, nil
}
```

#### 4. Branch Parsing

**Git Command**:
```bash
git branch -vv --all --format='%(refname:short)%00%(objectname:short)%00%(upstream:short)%00%(upstream:track)%00'
```

**Format**:
```
main<NULL>abc1234<NULL>origin/main<NULL>[ahead 2, behind 1]<NULL>
* feature<NULL>def5678<NULL><NULL><NULL>
```

**Parser Implementation**:
```go
func ParseBranches(output string) ([]models.Branch, error) {
    branches := []models.Branch{}

    lines := strings.Split(output, "\n")

    for _, line := range lines {
        if strings.TrimSpace(line) == "" {
            continue
        }

        // Check if current branch (starts with *)
        isCurrent := strings.HasPrefix(line, "* ")
        if isCurrent {
            line = line[2:]
        }

        parts := strings.Split(line, "\x00")
        if len(parts) < 4 {
            continue
        }

        name := parts[0]
        commitHash := parts[1]
        upstream := parts[2]
        track := parts[3]

        branch := models.Branch{
            Name:       name,
            FullName:   "refs/heads/" + name,
            IsCurrent:  isCurrent,
            IsRemote:   strings.HasPrefix(name, "remotes/"),
            CommitHash: commitHash,
            Upstream:   upstream,
        }

        // Parse ahead/behind from track info
        // Format: "[ahead 2, behind 1]"
        if track != "" {
            aheadRe := regexp.MustCompile(`ahead (\d+)`)
            behindRe := regexp.MustCompile(`behind (\d+)`)

            if matches := aheadRe.FindStringSubmatch(track); len(matches) > 1 {
                branch.AheadBy, _ = strconv.Atoi(matches[1])
            }
            if matches := behindRe.FindStringSubmatch(track); len(matches) > 1 {
                branch.BehindBy, _ = strconv.Atoi(matches[1])
            }
        }

        branches = append(branches, branch)
    }

    return branches, nil
}
```

#### 5. Progress Parsing (for fetch/pull/push)

**Git Command** (example):
```bash
git fetch --progress origin
```

**Progress Output** (stderr):
```
remote: Enumerating objects: 10, done.
remote: Counting objects: 100% (10/10), done.
remote: Compressing objects: 100% (8/8), done.
Receiving objects:  50% (5/10), 1.23 MiB | 512 KiB/s
Receiving objects: 100% (10/10), 2.45 MiB | 512 KiB/s, done.
```

**Parser Implementation**:
```go
func ParseProgressLine(line string, ctx context.Context) *models.ProgressEvent {
    // Match patterns like "Receiving objects: 50% (5/10)"
    progressRe := regexp.MustCompile(`(\w+\s+\w+):\s+(\d+)%\s+\((\d+)/(\d+)\)`)
    matches := progressRe.FindStringSubmatch(line)

    if len(matches) < 5 {
        return nil
    }

    operation := matches[1]
    percent, _ := strconv.Atoi(matches[2])
    current, _ := strconv.ParseInt(matches[3], 10, 64)
    total, _ := strconv.ParseInt(matches[4], 10, 64)

    event := &models.ProgressEvent{
        Operation: operation,
        Stage:     operation,
        Percent:   percent,
        Current:   current,
        Total:     total,
    }

    // Emit to frontend
    runtime.EventsEmit(ctx, "git:progress", event)

    return event
}
```

### Wails Binding Patterns

#### Service Registration

**app.go**:
```go
type App struct {
    ctx      context.Context
    repoPath string

    // Services
    RepositoryService *services.RepositoryService
    CommitService     *services.CommitService
    BranchService     *services.BranchService
    DiffService       *services.DiffService
    MergeService      *services.MergeService
    StagingService    *services.StagingService
    RemoteService     *services.RemoteService
    RebaseService     *services.RebaseService
    StashService      *services.StashService
    CherryPickService *services.CherryPickService
    ResetService      *services.ResetService
    TagService        *services.TagService
}

func NewApp() *App {
    return &App{}
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx

    // Services will be initialized after repository is opened
}
```

**main.go**:
```go
func main() {
    app := NewApp()

    err := wails.Run(&options.App{
        Title:     "Git Master",
        Width:     1200,
        Height:    800,
        MinWidth:  800,
        MinHeight: 600,
        AssetServer: &assetserver.Options{
            Assets: assets,
        },
        BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
        OnStartup:        app.startup,
        Bind: []interface{}{
            app,
        },
    })

    if err != nil {
        println("Error:", err.Error())
    }
}
```

#### Method Binding Example

**backend/services/commit_service.go**:
```go
package services

import (
    "context"
    "fmt"
    "git-master/backend/git"
    "git-master/backend/models"
)

type CommitService struct {
    ctx      context.Context
    executor *git.Executor
}

func NewCommitService(ctx context.Context, executor *git.Executor) *CommitService {
    return &CommitService{
        ctx:      ctx,
        executor: executor,
    }
}

// GetCommits retrieves paginated commit history
// This method is automatically bound to React by Wails
func (s *CommitService) GetCommits(limit, offset int) ([]models.Commit, error) {
    args := []string{
        "log",
        fmt.Sprintf("--pretty=format:%%H%%x00%%h%%x00%%an%%x00%%ae%%x00%%cn%%x00%%ce%%x00%%at%%x00%%ct%%x00%%s%%x00%%b%%x00%%P%%x00"),
        "--numstat",
        fmt.Sprintf("-n%d", limit),
        fmt.Sprintf("--skip=%d", offset),
    }

    result, err := s.executor.Execute(args...)
    if err != nil {
        return nil, fmt.Errorf("failed to get commits: %w", err)
    }

    commits, err := git.ParseCommitLog(result.Stdout)
    if err != nil {
        return nil, fmt.Errorf("failed to parse commits: %w", err)
    }

    return commits, nil
}
```

#### Frontend Usage

**frontend/src/api/commit.ts** (auto-generated by Wails):
```typescript
// Auto-generated by Wails CLI - do not edit

export interface Commit {
    hash: string;
    abbrevHash: string;
    author: Person;
    committer: Person;
    authorDate: string;  // ISO 8601
    commitDate: string;
    subject: string;
    body: string;
    parents: string[];
    filesChanged: number;
    insertions: number;
    deletions: number;
}

export function GetCommits(limit: number, offset: number): Promise<Commit[]> {
    return window['go']['services']['CommitService']['GetCommits'](limit, offset);
}
```

**frontend/src/stores/commitStore.ts**:
```typescript
import { create } from 'zustand';
import { GetCommits } from '../api/commit';
import type { Commit } from '../api/commit';

interface CommitStore {
    commits: Commit[];
    loading: boolean;
    error: string | null;

    fetchCommits: (limit: number, offset: number) => Promise<void>;
}

export const useCommitStore = create<CommitStore>((set) => ({
    commits: [],
    loading: false,
    error: null,

    fetchCommits: async (limit, offset) => {
        set({ loading: true, error: null });
        try {
            const commits = await GetCommits(limit, offset);
            set({ commits, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
```

### Event System for Progress Reporting

#### Backend Event Emission

**services/remote_service.go**:
```go
func (s *RemoteService) Fetch(remote string, prune bool) error {
    args := []string{"fetch", "--progress"}
    if prune {
        args = append(args, "--prune")
    }
    args = append(args, remote)

    handler := &ProgressHandler{
        ctx:       s.ctx,
        operation: "fetch",
    }

    err := s.executor.ExecuteStreaming(args, handler)
    if err != nil {
        return fmt.Errorf("fetch failed: %w", err)
    }

    // Emit completion event
    runtime.EventsEmit(s.ctx, "git:progress", models.ProgressEvent{
        Operation: "fetch",
        Stage:     "Complete",
        Percent:   100,
    })

    return nil
}

type ProgressHandler struct {
    ctx       context.Context
    operation string
}

func (h *ProgressHandler) HandleStdout(line string) {
    // Standard output
}

func (h *ProgressHandler) HandleStderr(line string) {
    // Git progress goes to stderr
    if event := git.ParseProgressLine(line, h.ctx); event != nil {
        event.Operation = h.operation
        runtime.EventsEmit(h.ctx, "git:progress", event)
    }
}
```

#### Frontend Event Listening

**frontend/src/components/ProgressBar.tsx**:
```typescript
import { useEffect, useState } from 'react';
import { EventsOn, EventsOff } from '../../wailsjs/runtime';

interface ProgressEvent {
    operation: string;
    stage: string;
    percent: number;
    total: number;
    current: number;
}

export function ProgressBar() {
    const [progress, setProgress] = useState<ProgressEvent | null>(null);

    useEffect(() => {
        // Subscribe to progress events
        const unsubscribe = EventsOn('git:progress', (data: ProgressEvent) => {
            setProgress(data);

            // Clear after completion
            if (data.percent === 100) {
                setTimeout(() => setProgress(null), 2000);
            }
        });

        return () => {
            EventsOff('git:progress');
        };
    }, []);

    if (!progress) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded p-4 w-64">
            <div className="text-sm font-medium mb-2">
                {progress.operation} - {progress.stage}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress.percent}%` }}
                />
            </div>
            <div className="text-xs text-gray-600 mt-1">
                {progress.percent}% ({progress.current}/{progress.total})
            </div>
        </div>
    );
}
```

### Error Handling and Recovery

#### Error Classification

**models/error.go**:
```go
package models

type ErrorCode string

const (
    // User errors (recoverable)
    ErrConflict          ErrorCode = "CONFLICT"
    ErrNotFound          ErrorCode = "NOT_FOUND"
    ErrInvalidInput      ErrorCode = "INVALID_INPUT"
    ErrDirtyWorkingTree  ErrorCode = "DIRTY_WORKING_TREE"
    ErrNonFastForward    ErrorCode = "NON_FAST_FORWARD"
    ErrAlreadyExists     ErrorCode = "ALREADY_EXISTS"

    // System errors (may not be recoverable)
    ErrPermission        ErrorCode = "PERMISSION_DENIED"
    ErrNetwork           ErrorCode = "NETWORK_ERROR"
    ErrTimeout           ErrorCode = "TIMEOUT"
    ErrCorrupted         ErrorCode = "CORRUPTED_REPO"

    // Git errors (may require manual intervention)
    ErrGitNotFound       ErrorCode = "GIT_NOT_FOUND"
    ErrGitCommand        ErrorCode = "GIT_COMMAND_FAILED"
    ErrAuthentication    ErrorCode = "AUTH_FAILED"
)

type GitError struct {
    Code        ErrorCode `json:"code"`
    Message     string    `json:"message"`
    Details     string    `json:"details"`
    Stderr      string    `json:"stderr"`
    Recoverable bool      `json:"recoverable"`
}

func (e *GitError) Error() string {
    return fmt.Sprintf("[%s] %s: %s", e.Code, e.Message, e.Details)
}

func NewGitError(code ErrorCode, message, details, stderr string) *GitError {
    return &GitError{
        Code:        code,
        Message:     message,
        Details:     details,
        Stderr:      stderr,
        Recoverable: isRecoverable(code),
    }
}

func isRecoverable(code ErrorCode) bool {
    switch code {
    case ErrConflict, ErrDirtyWorkingTree, ErrNonFastForward, ErrInvalidInput:
        return true
    default:
        return false
    }
}
```

#### Error Parsing

**git/executor.go**:
```go
func (e *Executor) parseError(result *ExecResult) error {
    stderr := result.Stderr

    // Conflict error
    if strings.Contains(stderr, "CONFLICT") {
        return models.NewGitError(
            models.ErrConflict,
            "Merge conflict detected",
            "Resolve conflicts in the listed files",
            stderr,
        )
    }

    // Non-fast-forward push
    if strings.Contains(stderr, "non-fast-forward") {
        return models.NewGitError(
            models.ErrNonFastForward,
            "Push rejected: non-fast-forward",
            "Pull the latest changes before pushing",
            stderr,
        )
    }

    // Dirty working tree
    if strings.Contains(stderr, "Please commit your changes") {
        return models.NewGitError(
            models.ErrDirtyWorkingTree,
            "Uncommitted changes",
            "Commit or stash your changes before proceeding",
            stderr,
        )
    }

    // Authentication failure
    if strings.Contains(stderr, "Authentication failed") ||
       strings.Contains(stderr, "Permission denied") {
        return models.NewGitError(
            models.ErrAuthentication,
            "Authentication failed",
            "Check your credentials or SSH keys",
            stderr,
        )
    }

    // Network error
    if strings.Contains(stderr, "Could not resolve host") ||
       strings.Contains(stderr, "Connection timed out") {
        return models.NewGitError(
            models.ErrNetwork,
            "Network error",
            "Check your internet connection",
            stderr,
        )
    }

    // Generic Git command failure
    return models.NewGitError(
        models.ErrGitCommand,
        "Git command failed",
        result.Stderr,
        stderr,
    )
}
```

#### Frontend Error Handling

**frontend/src/components/ErrorDisplay.tsx**:
```typescript
interface GitError {
    code: string;
    message: string;
    details: string;
    stderr: string;
    recoverable: boolean;
}

export function ErrorDisplay({ error }: { error: GitError }) {
    const getErrorColor = () => {
        return error.recoverable ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
    };

    const getRecoveryActions = () => {
        switch (error.code) {
            case 'CONFLICT':
                return 'Resolve conflicts in the affected files and try again.';
            case 'DIRTY_WORKING_TREE':
                return 'Commit or stash your changes before proceeding.';
            case 'NON_FAST_FORWARD':
                return 'Pull the latest changes from remote before pushing.';
            case 'AUTH_FAILED':
                return 'Check your credentials or SSH key configuration.';
            default:
                return 'See details below for more information.';
        }
    };

    return (
        <div className={`border rounded p-4 ${getErrorColor()}`}>
            <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold">{error.message}</h3>
                    <p className="text-sm mt-1">{error.details}</p>
                    <p className="text-sm mt-2 text-gray-600">{getRecoveryActions()}</p>

                    <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-gray-600">
                            Technical details
                        </summary>
                        <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                            {error.stderr}
                        </pre>
                    </details>
                </div>
            </div>
        </div>
    );
}
```

### Input Validation

**git/validator.go**:
```go
package git

import (
    "errors"
    "path/filepath"
    "regexp"
    "strings"
)

var (
    // Git ref name validation
    // https://git-scm.com/docs/git-check-ref-format
    refNameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._/-]*$`)

    // Commit hash validation
    commitHashRegex = regexp.MustCompile(`^[a-f0-9]{7,40}$`)
)

func ValidateBranchName(name string) error {
    if name == "" {
        return errors.New("branch name cannot be empty")
    }

    if len(name) > 255 {
        return errors.New("branch name too long (max 255 characters)")
    }

    // Invalid patterns
    if strings.HasPrefix(name, "-") ||
       strings.HasSuffix(name, ".") ||
       strings.Contains(name, "..") ||
       strings.Contains(name, "//") ||
       strings.Contains(name, "@{") {
        return errors.New("branch name contains invalid characters")
    }

    if !refNameRegex.MatchString(name) {
        return errors.New("branch name contains invalid characters")
    }

    return nil
}

func ValidateCommitHash(hash string) error {
    if !commitHashRegex.MatchString(hash) {
        return errors.New("invalid commit hash format")
    }
    return nil
}

func ValidateFilePath(repoPath, filePath string) error {
    // Ensure file path is within repository
    absFilePath, err := filepath.Abs(filepath.Join(repoPath, filePath))
    if err != nil {
        return err
    }

    absRepoPath, err := filepath.Abs(repoPath)
    if err != nil {
        return err
    }

    if !strings.HasPrefix(absFilePath, absRepoPath) {
        return errors.New("file path is outside repository")
    }

    return nil
}

func SanitizeCommitMessage(message string) string {
    // Remove any null bytes
    message = strings.ReplaceAll(message, "\x00", "")

    // Limit message size
    const maxSize = 100 * 1024 // 100KB
    if len(message) > maxSize {
        message = message[:maxSize]
    }

    return message
}
```

### Testing Strategy

#### 1. Unit Tests

**Test GitExecutor**:
```go
// backend/git/executor_test.go
package git

import (
    "context"
    "os"
    "path/filepath"
    "testing"
)

func TestExecutor_Execute(t *testing.T) {
    // Create temporary test repository
    tmpDir := t.TempDir()

    // Initialize Git repo
    cmd := exec.Command("git", "init", tmpDir)
    if err := cmd.Run(); err != nil {
        t.Fatal(err)
    }

    // Create executor
    executor, err := NewExecutor(context.Background(), tmpDir)
    if err != nil {
        t.Fatal(err)
    }

    // Test basic command
    result, err := executor.Execute("status", "--porcelain")
    if err != nil {
        t.Errorf("Execute failed: %v", err)
    }

    if result.ExitCode != 0 {
        t.Errorf("Expected exit code 0, got %d", result.ExitCode)
    }
}

func TestExecutor_InvalidRepo(t *testing.T) {
    tmpDir := t.TempDir()

    // Don't initialize Git repo
    executor, err := NewExecutor(context.Background(), tmpDir)
    if err != nil {
        t.Fatal(err)
    }

    // Should fail
    _, err = executor.Execute("status")
    if err == nil {
        t.Error("Expected error for non-Git directory")
    }
}
```

**Test Parsers**:
```go
// backend/git/log_parser_test.go
package git

import (
    "testing"
)

func TestParseCommitLog(t *testing.T) {
    input := `abc1234\x00abc123\x00John Doe\x00john@example.com\x00John Doe\x00john@example.com\x001234567890\x001234567890\x00Initial commit\x00\x00\x00

1\t0\tREADME.md
`

    commits, err := ParseCommitLog(input)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 1 {
        t.Errorf("Expected 1 commit, got %d", len(commits))
    }

    commit := commits[0]
    if commit.Hash != "abc1234" {
        t.Errorf("Expected hash 'abc1234', got '%s'", commit.Hash)
    }

    if commit.Author.Name != "John Doe" {
        t.Errorf("Expected author 'John Doe', got '%s'", commit.Author.Name)
    }

    if commit.FilesChanged != 1 {
        t.Errorf("Expected 1 file changed, got %d", commit.FilesChanged)
    }
}

func TestParseCommitLog_MergeCommit(t *testing.T) {
    input := `def5678\x00def567\x00Jane Doe\x00jane@example.com\x00Jane Doe\x00jane@example.com\x001234567891\x001234567891\x00Merge branch 'feature'\x00\x00abc1234 xyz9876\x00

2\t1\tfile.go
`

    commits, err := ParseCommitLog(input)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 1 {
        t.Fatal("Expected 1 commit")
    }

    commit := commits[0]
    if len(commit.Parents) != 2 {
        t.Errorf("Expected 2 parents, got %d", len(commit.Parents))
    }
}
```

#### 2. Integration Tests

**Test with Real Git Repository**:
```go
// backend/services/commit_service_test.go
package services

import (
    "context"
    "os"
    "os/exec"
    "path/filepath"
    "testing"
    "git-master/backend/git"
)

func setupTestRepo(t *testing.T) string {
    tmpDir := t.TempDir()

    // Initialize repo
    run(t, tmpDir, "git", "init")
    run(t, tmpDir, "git", "config", "user.name", "Test User")
    run(t, tmpDir, "git", "config", "user.email", "test@example.com")

    // Create commits
    writeFile(t, tmpDir, "file1.txt", "content1")
    run(t, tmpDir, "git", "add", ".")
    run(t, tmpDir, "git", "commit", "-m", "First commit")

    writeFile(t, tmpDir, "file2.txt", "content2")
    run(t, tmpDir, "git", "add", ".")
    run(t, tmpDir, "git", "commit", "-m", "Second commit")

    return tmpDir
}

func run(t *testing.T, dir string, command string, args ...string) {
    cmd := exec.Command(command, args...)
    cmd.Dir = dir
    if err := cmd.Run(); err != nil {
        t.Fatalf("Command failed: %s %v: %v", command, args, err)
    }
}

func writeFile(t *testing.T, dir, filename, content string) {
    path := filepath.Join(dir, filename)
    if err := os.WriteFile(path, []byte(content), 0644); err != nil {
        t.Fatal(err)
    }
}

func TestCommitService_GetCommits(t *testing.T) {
    repoPath := setupTestRepo(t)

    executor, err := git.NewExecutor(context.Background(), repoPath)
    if err != nil {
        t.Fatal(err)
    }

    service := NewCommitService(context.Background(), executor)

    commits, err := service.GetCommits(10, 0)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 2 {
        t.Errorf("Expected 2 commits, got %d", len(commits))
    }

    // Most recent commit should be first
    if commits[0].Subject != "Second commit" {
        t.Errorf("Expected 'Second commit', got '%s'", commits[0].Subject)
    }
}

func TestCommitService_GetCommitDetails(t *testing.T) {
    repoPath := setupTestRepo(t)

    executor, err := git.NewExecutor(context.Background(), repoPath)
    if err != nil {
        t.Fatal(err)
    }

    service := NewCommitService(context.Background(), executor)

    // Get commits to get a hash
    commits, _ := service.GetCommits(1, 0)
    hash := commits[0].Hash

    // Get details
    commit, err := service.GetCommitDetails(hash)
    if err != nil {
        t.Fatal(err)
    }

    if commit.Hash != hash {
        t.Errorf("Expected hash %s, got %s", hash, commit.Hash)
    }

    if len(commit.ChangedFiles) == 0 {
        t.Error("Expected changed files")
    }
}
```

#### 3. Test Fixtures

Create test repositories with specific states:

```go
// backend/testutil/fixtures.go
package testutil

import (
    "os"
    "os/exec"
    "path/filepath"
    "testing"
)

// CreateRepoWithConflict creates a repository with a merge conflict
func CreateRepoWithConflict(t *testing.T) string {
    tmpDir := t.TempDir()

    // Initialize
    run(t, tmpDir, "git", "init")
    run(t, tmpDir, "git", "config", "user.name", "Test")
    run(t, tmpDir, "git", "config", "user.email", "test@test.com")

    // Create file on main
    writeFile(t, tmpDir, "conflict.txt", "main version")
    run(t, tmpDir, "git", "add", ".")
    run(t, tmpDir, "git", "commit", "-m", "Main commit")

    // Create feature branch
    run(t, tmpDir, "git", "checkout", "-b", "feature")
    writeFile(t, tmpDir, "conflict.txt", "feature version")
    run(t, tmpDir, "git", "add", ".")
    run(t, tmpDir, "git", "commit", "-m", "Feature commit")

    // Back to main, modify same file
    run(t, tmpDir, "git", "checkout", "main")
    writeFile(t, tmpDir, "conflict.txt", "main updated")
    run(t, tmpDir, "git", "add", ".")
    run(t, tmpDir, "git", "commit", "-m", "Main update")

    // Attempt merge (will conflict)
    cmd := exec.Command("git", "merge", "feature")
    cmd.Dir = tmpDir
    _ = cmd.Run() // Expect failure

    return tmpDir
}

// CreateLargeRepo creates a repository with many commits
func CreateLargeRepo(t *testing.T, numCommits int) string {
    tmpDir := t.TempDir()

    run(t, tmpDir, "git", "init")
    run(t, tmpDir, "git", "config", "user.name", "Test")
    run(t, tmpDir, "git", "config", "user.email", "test@test.com")

    for i := 0; i < numCommits; i++ {
        filename := fmt.Sprintf("file%d.txt", i)
        content := fmt.Sprintf("content %d", i)
        writeFile(t, tmpDir, filename, content)
        run(t, tmpDir, "git", "add", ".")
        run(t, tmpDir, "git", "commit", "-m", fmt.Sprintf("Commit %d", i))
    }

    return tmpDir
}
```

#### 4. Benchmarks

```go
// backend/git/parser_bench_test.go
package git

import (
    "testing"
)

func BenchmarkParseCommitLog(b *testing.B) {
    // Large log output (100 commits)
    input := generateLargeLogOutput(100)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, err := ParseCommitLog(input)
        if err != nil {
            b.Fatal(err)
        }
    }
}

func BenchmarkParseDiff(b *testing.B) {
    // Large diff (1000 lines)
    input := generateLargeDiff(1000)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, err := ParseDiff(input)
        if err != nil {
            b.Fatal(err)
        }
    }
}
```

## Implementation Phases

### Phase 1: Foundation (Tasks 1-20)

**Goal**: Basic Git command execution and repository opening

**Scope**:
- Git executor with command execution
- Basic error handling
- Repository validation
- Repository opening
- Basic model definitions

**Deliverables**:
- Can detect Git installation
- Can open and validate repositories
- Can execute basic Git commands
- Can parse simple Git output

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 2: Commit History (Tasks 21-35)

**Goal**: Display commit history with pagination

**Scope**:
- Commit log parsing
- Pagination support
- Commit filtering
- Commit details retrieval
- Author and date parsing

**Deliverables**:
- View paginated commit history
- Filter commits by branch, author, date
- View full commit details
- Handle large repositories (100k+ commits)

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 3: Diff Operations (Tasks 36-50)

**Goal**: Generate and display diffs

**Scope**:
- Diff parsing
- Working directory diffs
- Staged diffs
- Commit diffs
- Binary file detection
- Rename detection

**Deliverables**:
- View working directory changes
- View staged changes
- View differences between commits
- Handle binary files and renames

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 4: Branch Operations (Tasks 51-65)

**Goal**: Complete branch management

**Scope**:
- Branch listing
- Branch creation and deletion
- Branch switching (checkout)
- Branch tracking info
- Branch validation

**Deliverables**:
- List all branches with tracking info
- Create, delete, rename branches
- Switch between branches safely
- Handle dirty working directory

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 5: Staging and Committing (Tasks 66-75)

**Goal**: Stage changes and create commits

**Scope**:
- Status parsing
- File staging/unstaging
- Commit creation
- Commit amending
- Validation

**Deliverables**:
- Stage and unstage files
- Create commits with messages
- Amend last commit
- View staged vs unstaged changes

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 6: Merge and Conflict Resolution (Tasks 76-90)

**Goal**: Handle merges and resolve conflicts

**Scope**:
- Merge operations
- Conflict detection
- Conflict parsing
- Conflict resolution
- Merge abort

**Deliverables**:
- Merge branches
- Detect and list conflicts
- Parse conflict markers
- Resolve conflicts
- Abort merges safely

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 7: Remote Operations (Tasks 91-105)

**Goal**: Fetch, pull, and push

**Scope**:
- Remote listing
- Fetch with progress
- Pull with strategies
- Push with progress
- Authentication handling
- Progress parsing

**Deliverables**:
- Fetch from remotes with progress
- Pull with merge/rebase
- Push with progress and force options
- Handle authentication errors

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 8: Advanced Operations (Tasks 106-125)

**Goal**: Rebase, stash, cherry-pick, reset, tags

**Scope**:
- Rebase operations
- Stash management
- Cherry-pick
- Reset (soft/mixed/hard)
- Tag operations

**Deliverables**:
- Rebase with conflict handling
- Create and apply stashes
- Cherry-pick commits
- Reset to commits
- Manage tags

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

### Phase 9: Testing and Polish (Tasks 126-140)

**Goal**: Comprehensive testing and error handling

**Scope**:
- Unit tests for all parsers
- Integration tests with real repos
- Error handling improvements
- Performance optimization
- Cross-platform testing

**Deliverables**:
- >80% test coverage
- All edge cases handled
- Performance benchmarks passing
- Works on all platforms

**Tasks**: See tasks/2024-10-11-XXXX-*.md

---

## Technical Considerations

### 1. Git Version Compatibility

**Minimum Version**: Git 2.30.0 (released January 2021)

**Rationale**:
- `--pretty=format` with NULL delimiters (stable in 2.30+)
- `--porcelain=v1` status format (stable)
- Progress output format standardized
- Modern performance optimizations

**Detection**:
```go
func ValidateGitVersion() (string, error) {
    cmd := exec.Command("git", "--version")
    output, err := cmd.Output()
    if err != nil {
        return "", fmt.Errorf("git not found")
    }

    // Parse: git version 2.30.0
    version := strings.TrimPrefix(string(output), "git version ")
    version = strings.TrimSpace(version)

    // Check minimum version
    if !isVersionAtLeast(version, "2.30.0") {
        return version, fmt.Errorf("git version too old: %s (minimum: 2.30.0)", version)
    }

    return version, nil
}
```

### 2. Cross-Platform Path Handling

**Windows Considerations**:
- Normalize backslashes to forward slashes before passing to Git
- Git on Windows expects forward slashes even on Windows
- Handle long path names (>260 chars) with extended path support

**Implementation**:
```go
func normalizePath(path string) string {
    // Convert to forward slashes
    path = filepath.ToSlash(path)

    // Remove any double slashes
    path = strings.ReplaceAll(path, "//", "/")

    return path
}
```

### 3. Performance Optimization

**Large Repository Strategies**:

**Pagination**:
- Default: 100 commits per page
- Use `git log -n <limit> --skip=<offset>`
- Never load entire history

**Streaming**:
- Use `StdoutPipe` for large outputs
- Parse line-by-line instead of buffering
- Cancel long operations with context

**Caching**:
- Cache current branch name (until checkout)
- Cache repository info (until refresh)
- Don't cache commit history (too large)

**Limits**:
```go
const (
    MaxDiffSize     = 10 * 1024 * 1024 // 10MB
    MaxCommitMsg    = 100 * 1024       // 100KB
    MaxFileSize     = 50 * 1024 * 1024 // 50MB (skip diff)
    DefaultTimeout  = 5 * time.Minute
    FetchTimeout    = 30 * time.Minute
)
```

### 4. Concurrency Control

**Problem**: Too many concurrent Git operations can overwhelm system

**Solution**: Semaphore limiting to 5 concurrent operations

```go
type Executor struct {
    semaphore chan struct{}
}

func NewExecutor() *Executor {
    return &Executor{
        semaphore: make(chan struct{}, 5), // Max 5 concurrent
    }
}

func (e *Executor) Execute(args ...string) (*ExecResult, error) {
    // Acquire slot
    e.semaphore <- struct{}{}
    defer func() { <-e.semaphore }()

    // Execute command
    // ...
}
```

### 5. Context and Cancellation

**All operations support cancellation**:

```go
func (s *CommitService) GetCommits(ctx context.Context, limit, offset int) ([]Commit, error) {
    // Check context before starting
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
    }

    // Use context in command execution
    cmd := exec.CommandContext(ctx, "git", args...)

    // Command automatically killed if context cancelled
}
```

### 6. Security Considerations

**Command Injection Prevention**:
- Never use shell execution (`sh -c`)
- Use `exec.Command` with argument array
- Validate all user inputs
- Don't allow arbitrary Git commands

**Example of Secure Execution**:
```go
// SECURE: Arguments are passed as array
cmd := exec.Command("git", "log", "-n", limit, "--", filePath)

// INSECURE: Don't do this!
cmd := exec.Command("sh", "-c", "git log -n " + limit + " -- " + filePath)
```

**Input Validation**:
- Validate branch names against Git ref format
- Validate commit hashes are hex
- Validate file paths are within repository
- Sanitize commit messages

### 7. Memory Management

**Avoid Memory Leaks**:
- Close all pipes from `exec.Command`
- Cancel contexts when operations complete
- Don't store large outputs in memory
- Use streaming for large diffs

**Example**:
```go
func (e *Executor) ExecuteStreaming(args ...string, handler OutputHandler) error {
    cmd := exec.CommandContext(e.ctx, "git", args...)

    stdout, err := cmd.StdoutPipe()
    if err != nil {
        return err
    }
    defer stdout.Close() // Important: close pipe

    if err := cmd.Start(); err != nil {
        return err
    }

    scanner := bufio.NewScanner(stdout)
    for scanner.Scan() {
        handler.HandleLine(scanner.Text())
    }

    return cmd.Wait()
}
```

### 8. Error Recovery

**Atomic Operations**:
- Check for conflicts before merging
- Validate before destructive operations
- Provide abort mechanisms

**State Detection**:
- Detect if repository is in merge state
- Detect if repository is in rebase state
- Block conflicting operations

```go
func (s *MergeService) IsInMerge() (bool, error) {
    // Check if .git/MERGE_HEAD exists
    mergePath := filepath.Join(s.executor.repoPath, ".git", "MERGE_HEAD")
    _, err := os.Stat(mergePath)
    return err == nil, nil
}
```

### 9. Logging and Monitoring

**Structured Logging**:
```go
import "log/slog"

func (e *Executor) Execute(args ...string) (*ExecResult, error) {
    slog.Info("Executing Git command",
        "command", "git",
        "args", args,
        "repo", e.repoPath,
    )

    start := time.Now()
    result, err := e.execute(args...)
    duration := time.Since(start)

    if err != nil {
        slog.Error("Git command failed",
            "args", args,
            "duration", duration,
            "error", err,
            "stderr", result.Stderr,
        )
    } else {
        slog.Debug("Git command succeeded",
            "args", args,
            "duration", duration,
        )
    }

    return result, err
}
```

### 10. Testing Challenges and Solutions

**Challenge**: Unit tests for Git operations require actual Git repositories

**Solution**: Create temporary test repositories in `t.TempDir()`

**Challenge**: Integration tests are slow

**Solution**: Use parallel tests and test fixtures

```go
func TestParallelServices(t *testing.T) {
    t.Parallel() // Run in parallel

    repoPath := setupTestRepo(t)
    // ... test logic
}
```

**Challenge**: Cross-platform testing

**Solution**: Use GitHub Actions with multiple OS runners

```yaml
# .github/workflows/test.yml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
```

## Estimated Timeline

### Overall Summary

- **Phase 1 (Foundation)**: 20 tasks, ~40 hours, 5 days
- **Phase 2 (Commit History)**: 15 tasks, ~30 hours, 4 days
- **Phase 3 (Diff Operations)**: 15 tasks, ~30 hours, 4 days
- **Phase 4 (Branch Operations)**: 15 tasks, ~30 hours, 4 days
- **Phase 5 (Staging/Committing)**: 10 tasks, ~20 hours, 2.5 days
- **Phase 6 (Merge/Conflicts)**: 15 tasks, ~30 hours, 4 days
- **Phase 7 (Remote Operations)**: 15 tasks, ~30 hours, 4 days
- **Phase 8 (Advanced Operations)**: 20 tasks, ~40 hours, 5 days
- **Phase 9 (Testing/Polish)**: 15 tasks, ~30 hours, 4 days

**Total**: 140 tasks, ~280 hours, ~35 working days (7 weeks)

**Note**: This timeline assumes one developer working full-time. With 2-3 developers working in parallel on independent services, timeline can be reduced to 3-4 weeks.

### Critical Path

1. **Week 1**: Foundation + Commit History (Phases 1-2)
2. **Week 2**: Diff + Branch Operations (Phases 3-4)
3. **Week 3**: Staging + Merge Operations (Phases 5-6)
4. **Week 4**: Remote Operations (Phase 7)
5. **Week 5**: Advanced Operations (Phase 8)
6. **Week 6**: Testing and Polish (Phase 9)
7. **Week 7**: Buffer for unexpected issues

## Dependencies and Prerequisites

### External Dependencies

**Required**:
- Go 1.21+ installed
- Git 2.30+ installed and in PATH
- Wails CLI installed (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

**Optional**:
- SSH keys configured (for SSH remote operations)
- Git credential helper configured (for HTTPS remote operations)

### Internal Dependencies

**Service Dependencies**:
```
RepositoryService (no dependencies)
    └── GitExecutor

CommitService
    └── GitExecutor
    └── LogParser

BranchService
    └── GitExecutor
    └── BranchParser

DiffService
    └── GitExecutor
    └── DiffParser

MergeService
    └── GitExecutor
    └── ConflictParser
    └── BranchService (check current branch)

StagingService
    └── GitExecutor
    └── StatusParser

RemoteService
    └── GitExecutor
    └── ProgressParser

RebaseService
    └── GitExecutor
    └── ConflictParser

StashService
    └── GitExecutor
    └── DiffParser

CherryPickService
    └── GitExecutor
    └── ConflictParser

ResetService
    └── GitExecutor

TagService
    └── GitExecutor
```

**Build Order**:
1. Models (no dependencies)
2. GitExecutor
3. Parsers
4. RepositoryService
5. All other services (parallel)
6. Integration into App struct
7. Wails bindings (auto-generated)

## Risk Mitigation

### Risk 1: Git Command Output Changes

**Risk**: Git output format changes in future versions break parsers

**Mitigation**:
- Use stable porcelain formats where available
- Specify format explicitly with `--pretty=format`
- Test against multiple Git versions
- Use NULL delimiters to avoid ambiguity

### Risk 2: Performance with Large Repositories

**Risk**: Application freezes with large repositories (100k+ commits, 10k+ files)

**Mitigation**:
- Implement strict pagination (never load all data)
- Use streaming for large outputs
- Implement timeouts
- Profile and benchmark regularly
- Add loading indicators

### Risk 3: Cross-Platform Incompatibilities

**Risk**: Application works on macOS but fails on Windows/Linux

**Mitigation**:
- Use `filepath` package for path handling
- Test on all platforms via CI
- Normalize paths before passing to Git
- Handle platform-specific line endings

### Risk 4: Command Injection

**Risk**: User input allows execution of arbitrary commands

**Mitigation**:
- Never use shell execution
- Validate all inputs
- Use argument arrays, not command strings
- Sanitize commit messages and file paths
- Security audit before release

### Risk 5: Data Loss

**Risk**: Bug causes repository corruption or uncommitted work loss

**Mitigation**:
- Validate operations before execution
- Implement confirmations for destructive operations
- Test thoroughly with real repositories
- Never modify .git directory directly
- Rely on Git commands only

### Risk 6: Authentication Failures

**Risk**: Remote operations fail due to authentication issues

**Mitigation**:
- Use Git's native credential helpers
- Provide clear error messages
- Document SSH key setup
- Handle different authentication methods
- Test with multiple Git hosting providers

## Success Criteria

### Functional Requirements Met

- [ ] All services implemented with methods defined in PRD
- [ ] All Git operations work correctly
- [ ] Error handling covers all edge cases
- [ ] Cross-platform compatibility verified
- [ ] Integration with Wails completed

### Performance Requirements Met

- [ ] Repository opening: <500ms
- [ ] Commit history (100 commits): <1s
- [ ] Diff generation: <200ms per file
- [ ] Branch listing: <300ms
- [ ] All operations within timeout limits

### Quality Requirements Met

- [ ] Test coverage >80%
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] No memory leaks detected
- [ ] No security vulnerabilities

### Documentation Complete

- [ ] All public methods documented
- [ ] Architecture documented
- [ ] Testing guide written
- [ ] Contribution guidelines created

## Future Enhancements

**Post-MVP Features**:
1. File system watching for external changes
2. Git LFS support
3. Sparse checkout support
4. Submodule UI
5. Git blame integration
6. GitHub/GitLab integration
7. GPG signing support
8. Custom merge tools
9. Advanced rebase UI
10. Performance profiling dashboard

These enhancements are out of scope for initial implementation but should be considered in architecture design.
