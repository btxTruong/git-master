package git

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
)

// Executor handles Git command execution
type Executor struct {
	repoPath string
}

// NewExecutor creates a new Git executor for a repository
func NewExecutor(repoPath string) *Executor {
	return &Executor{
		repoPath: repoPath,
	}
}

// GitResult contains the result of a Git command
type GitResult struct {
	Stdout   string
	Stderr   string
	ExitCode int
}

// Execute runs a Git command and returns the result
func (e *Executor) Execute(ctx context.Context, args ...string) (*GitResult, error) {
	return e.ExecuteWithEnv(ctx, nil, args...)
}

// ExecuteWithEnv runs a Git command with custom environment variables and returns the result
func (e *Executor) ExecuteWithEnv(ctx context.Context, env []string, args ...string) (*GitResult, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = e.repoPath

	// Set custom environment variables if provided
	if env != nil && len(env) > 0 {
		cmd.Env = append(cmd.Environ(), env...)
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	result := &GitResult{
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		ExitCode: 0,
	}

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
		}
		// Return result even on error so caller can inspect stderr
		return result, fmt.Errorf("git command failed: %w", err)
	}

	return result, nil
}

// ExecuteLines runs a Git command and returns stdout as lines
func (e *Executor) ExecuteLines(ctx context.Context, args ...string) ([]string, error) {
	result, err := e.Execute(ctx, args...)
	if err != nil {
		return nil, err
	}

	if result.Stdout == "" {
		return []string{}, nil
	}

	lines := strings.Split(strings.TrimSpace(result.Stdout), "\n")
	return lines, nil
}

// IsGitRepository checks if the path is a valid Git repository
func IsGitRepository(path string) bool {
	cmd := exec.Command("git", "rev-parse", "--git-dir")
	cmd.Dir = path

	err := cmd.Run()
	return err == nil
}

// GetRepositoryRoot returns the root path of the Git repository
func GetRepositoryRoot(path string) (string, error) {
	cmd := exec.Command("git", "rev-parse", "--show-toplevel")
	cmd.Dir = path

	var stdout bytes.Buffer
	cmd.Stdout = &stdout

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("not a git repository")
	}

	return strings.TrimSpace(stdout.String()), nil
}
