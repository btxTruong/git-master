package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"git-master/backend/models"
)

// CommitService handles commit operations
type CommitService struct {
	ctx      context.Context
	executor *git.Executor
}

// NewCommitService creates a new commit service
func NewCommitService(executor *git.Executor) *CommitService {
	return &CommitService{
		executor: executor,
	}
}

// Startup is called when the app starts
func (s *CommitService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetExecutor sets the Git executor (called when repository changes)
func (s *CommitService) SetExecutor(executor *git.Executor) {
	s.executor = executor
}

// GetCommits retrieves commit history with pagination
func (s *CommitService) GetCommits(limit, offset int) ([]models.Commit, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Git log format:
	// %H  = commit hash
	// %h  = abbreviated commit hash
	// %an = author name
	// %ae = author email
	// %cn = committer name
	// %ce = committer email
	// %ad = author date (respects --date)
	// %d  = ref names (branches, tags)
	// %s  = subject (commit message first line)
	format := "%H|%h|%an|%ae|%cn|%ce|%ad|%d|%s"

	args := []string{
		"log",
		fmt.Sprintf("--max-count=%d", limit),
		fmt.Sprintf("--skip=%d", offset),
		fmt.Sprintf("--pretty=format:%s", format),
		"--date=format:%Y-%m-%d %H:%M:%S %z",
		"--all", // show commits from all branches
	}

	result, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get commits: %w", err)
	}

	commits, err := git.ParseCommits(result.Stdout)
	if err != nil {
		return nil, err
	}

	return commits, nil
}

// GetCommitDetail retrieves detailed information about a specific commit
func (s *CommitService) GetCommitDetail(commitHash string) (*models.CommitDetail, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Get commit info
	format := "%H|%h|%an|%ae|%cn|%ce|%ad|%d|%s"
	logResult, err := s.executor.Execute(
		s.ctx,
		"log",
		"-1",
		commitHash,
		fmt.Sprintf("--pretty=format:%s", format),
		"--date=format:%Y-%m-%d %H:%M:%S %z",
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit info: %w", err)
	}

	commits, err := git.ParseCommits(logResult.Stdout)
	if err != nil || len(commits) == 0 {
		return nil, fmt.Errorf("failed to parse commit: %w", err)
	}

	commit := commits[0]

	// Get commit message (full)
	msgResult, err := s.executor.Execute(s.ctx, "log", "-1", "--pretty=format:%B", commitHash)
	if err == nil {
		commit.Message = msgResult.Stdout
	}

	// Get files changed in this commit
	filesResult, err := s.executor.Execute(
		s.ctx,
		"diff-tree",
		"--no-commit-id",
		"--name-status",
		"-r",
		commitHash,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get changed files: %w", err)
	}

	files, err := git.ParseFileChanges(filesResult.Stdout)
	if err != nil {
		return nil, fmt.Errorf("failed to parse file changes: %w", err)
	}

	detail := &models.CommitDetail{
		Commit: commit,
		Files:  files,
		Diff:   "",
	}

	return detail, nil
}

// GetFileDiff retrieves the diff for a specific file in a commit
func (s *CommitService) GetFileDiff(commitHash, filePath string) (string, error) {
	if s.executor == nil {
		return "", fmt.Errorf("no repository opened")
	}

	// Get the diff for the specific file
	diffResult, err := s.executor.Execute(
		s.ctx,
		"show",
		fmt.Sprintf("%s:%s", commitHash, filePath),
		"--",
		filePath,
	)
	if err != nil {
		// Try with parent commit comparison
		diffResult, err = s.executor.Execute(
			s.ctx,
			"diff",
			fmt.Sprintf("%s^", commitHash),
			commitHash,
			"--",
			filePath,
		)
		if err != nil {
			return "", fmt.Errorf("failed to get file diff: %w", err)
		}
	}

	return diffResult.Stdout, nil
}
