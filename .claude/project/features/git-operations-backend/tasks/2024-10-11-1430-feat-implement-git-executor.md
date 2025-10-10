# Task: Implement Git Executor

**Type**: feat
**Status**: todo
**Estimated Effort**: 4 hours
**Dependencies**: 2024-10-11-1400-feat-create-models-package.md

## Description

Create the core `GitExecutor` struct that wraps Git command execution using `os/exec`. This is the foundation for all Git operations and handles command building, process spawning, output capture, and error parsing.

## Acceptance Criteria

- [x] File `backend/git/executor.go` created
- [x] GitExecutor struct implemented with semaphore for concurrency control
- [x] NewExecutor constructor validates Git installation and repository
- [x] Execute method runs Git commands and captures output
- [x] ExecuteStreaming method streams output for long operations
- [x] Error parsing implemented for common Git errors
- [x] Proper context support for cancellation
- [x] Semaphore limits concurrent operations to 5
- [x] All methods documented

## Technical Details

### GitExecutor Structure

```go
package git

import (
    "bytes"
    "context"
    "fmt"
    "os/exec"
    "bufio"
    "git-master/backend/models"
)

type Executor struct {
    repoPath      string
    gitPath       string
    ctx           context.Context
    maxConcurrent int
    semaphore     chan struct{}
}

type ExecResult struct {
    Stdout   string
    Stderr   string
    ExitCode int
}

type OutputHandler interface {
    HandleStdout(line string)
    HandleStderr(line string)
}
```

### Constructor

```go
func NewExecutor(ctx context.Context, repoPath string) (*Executor, error) {
    // Find git executable
    gitPath, err := exec.LookPath("git")
    if err != nil {
        return nil, models.NewGitError(
            models.ErrGitNotFound,
            "Git executable not found",
            "Install Git and ensure it's in your PATH",
            err.Error(),
        )
    }

    // Validate repository (check .git exists)
    if !isValidRepo(repoPath) {
        return nil, models.NewGitError(
            models.ErrNotFound,
            "Not a Git repository",
            "The selected directory is not a valid Git repository",
            "",
        )
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

### Execute Method (Synchronous)

```go
func (e *Executor) Execute(args ...string) (*ExecResult, error) {
    // Acquire semaphore slot
    e.semaphore <- struct{}{}
    defer func() { <-e.semaphore }()

    // Check context
    select {
    case <-e.ctx.Done():
        return nil, e.ctx.Err()
    default:
    }

    // Build command
    cmd := exec.CommandContext(e.ctx, e.gitPath, args...)
    cmd.Dir = e.repoPath

    // Set environment
    cmd.Env = append(os.Environ(),
        "GIT_TERMINAL_PROMPT=0",  // Disable interactive prompts
        "LANG=C",                  // Ensure English output
        "LC_ALL=C",
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
        ExitCode: 0,
    }

    if cmd.ProcessState != nil {
        result.ExitCode = cmd.ProcessState.ExitCode()
    }

    // Parse error if command failed
    if err != nil {
        return result, e.parseError(result)
    }

    return result, nil
}
```

### ExecuteStreaming Method

```go
func (e *Executor) ExecuteStreaming(args []string, handler OutputHandler) error {
    e.semaphore <- struct{}{}
    defer func() { <-e.semaphore }()

    select {
    case <-e.ctx.Done():
        return e.ctx.Err()
    default:
    }

    cmd := exec.CommandContext(e.ctx, e.gitPath, args...)
    cmd.Dir = e.repoPath
    cmd.Env = append(os.Environ(), "GIT_TERMINAL_PROMPT=0", "LANG=C", "LC_ALL=C")

    // Create pipes
    stdout, err := cmd.StdoutPipe()
    if err != nil {
        return err
    }
    defer stdout.Close()

    stderr, err := cmd.StderrPipe()
    if err != nil {
        return err
    }
    defer stderr.Close()

    // Start command
    if err := cmd.Start(); err != nil {
        return err
    }

    // Stream stdout in goroutine
    done := make(chan error, 2)
    go func() {
        scanner := bufio.NewScanner(stdout)
        for scanner.Scan() {
            handler.HandleStdout(scanner.Text())
        }
        done <- scanner.Err()
    }()

    // Stream stderr in goroutine
    go func() {
        scanner := bufio.NewScanner(stderr)
        for scanner.Scan() {
            handler.HandleStderr(scanner.Text())
        }
        done <- scanner.Err()
    }()

    // Wait for both streams
    <-done
    <-done

    // Wait for command completion
    return cmd.Wait()
}
```

### Error Parsing

```go
func (e *Executor) parseError(result *ExecResult) error {
    stderr := result.Stderr

    // Conflict
    if strings.Contains(stderr, "CONFLICT") {
        return models.NewGitError(
            models.ErrConflict,
            "Merge conflict detected",
            "Resolve conflicts in the listed files",
            stderr,
        )
    }

    // Non-fast-forward
    if strings.Contains(stderr, "non-fast-forward") {
        return models.NewGitError(
            models.ErrNonFastForward,
            "Push rejected: non-fast-forward",
            "Pull the latest changes before pushing",
            stderr,
        )
    }

    // Dirty working tree
    if strings.Contains(stderr, "Please commit your changes") ||
       strings.Contains(stderr, "would be overwritten") {
        return models.NewGitError(
            models.ErrDirtyWorkingTree,
            "Uncommitted changes",
            "Commit or stash your changes before proceeding",
            stderr,
        )
    }

    // Authentication
    if strings.Contains(stderr, "Authentication failed") ||
       strings.Contains(stderr, "Permission denied") {
        return models.NewGitError(
            models.ErrAuthentication,
            "Authentication failed",
            "Check your credentials or SSH keys",
            stderr,
        )
    }

    // Network
    if strings.Contains(stderr, "Could not resolve host") ||
       strings.Contains(stderr, "Connection timed out") {
        return models.NewGitError(
            models.ErrNetwork,
            "Network error",
            "Check your internet connection",
            stderr,
        )
    }

    // Generic
    return models.NewGitError(
        models.ErrGitCommand,
        "Git command failed",
        stderr,
        stderr,
    )
}
```

### Helper Functions

```go
func isValidRepo(path string) bool {
    gitPath := filepath.Join(path, ".git")
    info, err := os.Stat(gitPath)
    if err != nil {
        return false
    }

    // Can be directory or file (for worktrees/submodules)
    return info.IsDir() || info.Mode().IsRegular()
}

func (e *Executor) GetRepoPath() string {
    return e.repoPath
}

func (e *Executor) GetGitPath() string {
    return e.gitPath
}
```

## Implementation Notes

- Use `CommandContext` for automatic cancellation
- Set `GIT_TERMINAL_PROMPT=0` to prevent interactive prompts
- Set `LANG=C` to ensure English output for parsing
- Semaphore prevents resource exhaustion with many concurrent operations
- Always close pipes in `ExecuteStreaming` to prevent leaks
- Parse stderr for common error patterns
- Return structured `GitError` instead of raw errors

## Testing

**Test file**: `backend/git/executor_test.go`

```go
package git

import (
    "context"
    "os/exec"
    "testing"
    "path/filepath"
)

func setupTestRepo(t *testing.T) string {
    tmpDir := t.TempDir()
    cmd := exec.Command("git", "init", tmpDir)
    if err := cmd.Run(); err != nil {
        t.Fatal(err)
    }
    return tmpDir
}

func TestNewExecutor_ValidRepo(t *testing.T) {
    repoPath := setupTestRepo(t)
    executor, err := NewExecutor(context.Background(), repoPath)

    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }

    if executor.GetRepoPath() != repoPath {
        t.Errorf("Expected repo path %s, got %s", repoPath, executor.GetRepoPath())
    }
}

func TestNewExecutor_InvalidRepo(t *testing.T) {
    tmpDir := t.TempDir()
    _, err := NewExecutor(context.Background(), tmpDir)

    if err == nil {
        t.Error("Expected error for non-Git directory")
    }
}

func TestExecutor_Execute_BasicCommand(t *testing.T) {
    repoPath := setupTestRepo(t)
    executor, _ := NewExecutor(context.Background(), repoPath)

    result, err := executor.Execute("status", "--porcelain")
    if err != nil {
        t.Fatalf("Execute failed: %v", err)
    }

    if result.ExitCode != 0 {
        t.Errorf("Expected exit code 0, got %d", result.ExitCode)
    }
}

func TestExecutor_Execute_InvalidCommand(t *testing.T) {
    repoPath := setupTestRepo(t)
    executor, _ := NewExecutor(context.Background(), repoPath)

    _, err := executor.Execute("invalid-command")
    if err == nil {
        t.Error("Expected error for invalid command")
    }
}

func TestExecutor_ConcurrencyLimit(t *testing.T) {
    repoPath := setupTestRepo(t)
    executor, _ := NewExecutor(context.Background(), repoPath)

    // Start 10 concurrent operations
    done := make(chan error, 10)
    for i := 0; i < 10; i++ {
        go func() {
            _, err := executor.Execute("status")
            done <- err
        }()
    }

    // All should complete without error
    for i := 0; i < 10; i++ {
        if err := <-done; err != nil {
            t.Errorf("Concurrent execution failed: %v", err)
        }
    }
}
```
