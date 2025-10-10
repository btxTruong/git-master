package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"git-master/backend/models"
	"path/filepath"
	"time"
)

// RepositoryService handles repository operations
type RepositoryService struct {
	ctx      context.Context
	executor *git.Executor
	repo     *models.Repository
}

// NewRepositoryService creates a new repository service
func NewRepositoryService() *RepositoryService {
	return &RepositoryService{}
}

// Startup is called when the app starts
func (s *RepositoryService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// OpenRepository opens a Git repository at the given path
func (s *RepositoryService) OpenRepository(path string) (*models.Repository, error) {
	// Verify it's a Git repository
	if !git.IsGitRepository(path) {
		return nil, fmt.Errorf("not a git repository: %s", path)
	}

	// Get repository root
	rootPath, err := git.GetRepositoryRoot(path)
	if err != nil {
		return nil, err
	}

	// Create executor for this repository
	s.executor = git.NewExecutor(rootPath)

	// Get current branch
	result, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return nil, fmt.Errorf("failed to get current branch: %w", err)
	}

	currentBranch := result.Stdout
	isDetached := currentBranch == "HEAD"

	// Create repository model
	s.repo = &models.Repository{
		Path:          rootPath,
		Name:          filepath.Base(rootPath),
		CurrentBranch: currentBranch,
		IsDetached:    isDetached,
		LastOpened:    time.Now(),
	}

	return s.repo, nil
}

// GetStatus gets the current repository status
func (s *RepositoryService) GetStatus() (*models.RepositoryStatus, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Get current branch
	branchResult, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return nil, err
	}
	currentBranch := branchResult.Stdout

	// Get file status
	statusResult, err := s.executor.Execute(s.ctx, "status", "--porcelain")
	if err != nil {
		return nil, err
	}

	staged, unstaged, untracked := git.ParseFileStatus(statusResult.Stdout)

	// Check for conflicts
	conflictsResult, err := s.executor.Execute(s.ctx, "diff", "--name-only", "--diff-filter=U")
	hasConflicts := err == nil && conflictsResult.Stdout != ""
	var conflictedFiles []string
	if hasConflicts {
		conflictedFiles = append(conflictedFiles, staged...)
	}

	// Get ahead/behind count (if tracking a remote)
	ahead := 0
	behind := 0

	upstreamResult, _ := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "@{upstream}")
	if upstreamResult != nil && upstreamResult.ExitCode == 0 {
		countResult, err := s.executor.Execute(s.ctx, "rev-list", "--left-right", "--count", "HEAD...@{upstream}")
		if err == nil {
			fmt.Sscanf(countResult.Stdout, "%d\t%d", &ahead, &behind)
		}
	}

	status := &models.RepositoryStatus{
		Branch:          currentBranch,
		Ahead:           ahead,
		Behind:          behind,
		StagedFiles:     staged,
		UnstagedFiles:   unstaged,
		UntrackedFiles:  untracked,
		HasConflicts:    hasConflicts,
		ConflictedFiles: conflictedFiles,
	}

	return status, nil
}

// GetCurrentRepository returns the currently opened repository
func (s *RepositoryService) GetCurrentRepository() *models.Repository {
	return s.repo
}

// GetCommits retrieves commit history with pagination
func (s *RepositoryService) GetCommits(limit, offset int) ([]models.Commit, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Git log format
	format := "%H|%h|%an|%ae|%cn|%ce|%ad|%d|%s"

	args := []string{
		"log",
		fmt.Sprintf("--max-count=%d", limit),
		fmt.Sprintf("--skip=%d", offset),
		fmt.Sprintf("--pretty=format:%s", format),
		"--date=format:%Y-%m-%d %H:%M:%S %z",
		"--all",
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
