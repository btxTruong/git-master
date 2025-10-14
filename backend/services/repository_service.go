package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"git-master/backend/models"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// RepositoryService handles repository operations
type RepositoryService struct {
	ctx            context.Context
	executor       *git.Executor
	repo           *models.Repository
	remoteService  *RemoteService
	stagingService *StagingService
	commitService  *CommitService
}

// NewRepositoryService creates a new repository service
func NewRepositoryService() *RepositoryService {
	return &RepositoryService{}
}

// SetRemoteService sets the remote service reference
func (s *RepositoryService) SetRemoteService(remoteService *RemoteService) {
	s.remoteService = remoteService
}

// SetStagingService sets the staging service reference
func (s *RepositoryService) SetStagingService(stagingService *StagingService) {
	s.stagingService = stagingService
}

// SetCommitService sets the commit service reference
func (s *RepositoryService) SetCommitService(commitService *CommitService) {
	s.commitService = commitService
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

	// Update services with new executor
	if s.remoteService != nil {
		s.remoteService.SetExecutor(s.executor)
	}
	if s.commitService != nil {
		s.commitService.SetExecutor(s.executor)
	}

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

// GetCommits retrieves commit history with pagination and filters
func (s *RepositoryService) GetCommits(limit, offset int, filters models.CommitFilters) ([]models.Commit, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Git log format - added %P for parent hashes
	format := "%H|%h|%an|%ae|%cn|%ce|%ad|%P|%d|%s"

	args := []string{
		"log",
		fmt.Sprintf("--pretty=format:%s", format),
		"--date=format:%Y-%m-%d %H:%M:%S %z",
	}

	// Check if search text looks like a commit hash
	searchingByHash := false
	if filters.SearchText != "" {
		searchText := strings.TrimSpace(filters.SearchText)
		// Check if search text looks like a commit hash (hexadecimal, at least 4 chars)
		isLikelyHash := len(searchText) >= 4 && searchText == strings.ToLower(searchText) &&
			!strings.ContainsAny(searchText, " \t\n\r!@#$%^&*()+=[]{}|;:'\",.<>?/\\")

		if isLikelyHash {
			// For hash search, don't use pagination - search all commits
			searchingByHash = true
			// Don't add --grep for hash search, we'll filter after
		} else {
			// For message search, use git's built-in grep
			args = append(args, "--grep="+searchText, "--regexp-ignore-case")
		}
	}

	// Only apply pagination if not searching by hash
	if !searchingByHash {
		args = append(args, fmt.Sprintf("--max-count=%d", limit))
		args = append(args, fmt.Sprintf("--skip=%d", offset))
	}

	// Apply branch filter
	if filters.Branch != "" {
		args = append(args, filters.Branch)
	} else {
		args = append(args, "--all")
	}

	// Apply author filter
	if filters.Author != "" {
		args = append(args, fmt.Sprintf("--author=%s", filters.Author))
	}

	// Apply date range filters
	if filters.DateFrom != "" {
		args = append(args, fmt.Sprintf("--since=%s", filters.DateFrom))
	}
	if filters.DateTo != "" {
		args = append(args, fmt.Sprintf("--until=%s", filters.DateTo))
	}

	result, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get commits: %w", err)
	}

	commits, err := git.ParseCommits(result.Stdout)
	if err != nil {
		return nil, err
	}

	// If searching by hash, filter commits to only those matching the hash
	if searchingByHash && filters.SearchText != "" {
		searchText := strings.TrimSpace(filters.SearchText)
		searchLower := strings.ToLower(searchText)
		filteredCommits := []models.Commit{}

		for _, commit := range commits {
			if strings.Contains(strings.ToLower(commit.Hash), searchLower) ||
				strings.Contains(strings.ToLower(commit.ShortHash), searchLower) {
				filteredCommits = append(filteredCommits, commit)
			}
		}

		commits = filteredCommits

		// Apply pagination to filtered results
		start := offset
		end := offset + limit
		if start > len(commits) {
			commits = []models.Commit{}
		} else {
			if end > len(commits) {
				end = len(commits)
			}
			commits = commits[start:end]
		}
	}

	return commits, nil
}

// GetCommitDetail retrieves detailed information about a specific commit
func (s *RepositoryService) GetCommitDetail(commitHash string) (*models.CommitDetail, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Get commit info - added %P for parent hashes
	format := "%H|%h|%an|%ae|%cn|%ce|%ad|%P|%d|%s"
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

	// Get full commit message
	msgResult, err := s.executor.Execute(s.ctx, "log", "-1", "--pretty=format:%B", commitHash)
	if err == nil {
		commit.Message = msgResult.Stdout
	}

	// Get diff with file stats
	diffResult, err := s.executor.Execute(
		s.ctx,
		"show",
		"--pretty=format:",
		"--numstat",
		commitHash,
	)

	files := []models.FileChange{}
	if err == nil && diffResult.Stdout != "" {
		lines := strings.Split(strings.TrimSpace(diffResult.Stdout), "\n")
		for _, line := range lines {
			if line == "" {
				continue
			}
			parts := strings.Fields(line)
			if len(parts) < 3 {
				continue
			}

			insertions := 0
			deletions := 0
			if parts[0] != "-" {
				fmt.Sscanf(parts[0], "%d", &insertions)
			}
			if parts[1] != "-" {
				fmt.Sscanf(parts[1], "%d", &deletions)
			}

			filePath := strings.Join(parts[2:], " ")
			status := models.ChangeModified

			// Check if it's a new file
			if parts[1] == "0" && insertions > 0 {
				status = models.ChangeAdded
			} else if parts[0] == "0" && deletions > 0 {
				status = models.ChangeDeleted
			}

			files = append(files, models.FileChange{
				NewPath:    filePath,
				OldPath:    filePath,
				Status:     status,
				Insertions: insertions,
				Deletions:  deletions,
			})
		}
	}

	// Get full diff
	fullDiffResult, err := s.executor.Execute(
		s.ctx,
		"show",
		"--pretty=format:",
		commitHash,
	)
	diff := ""
	if err == nil {
		diff = fullDiffResult.Stdout
	}

	detail := &models.CommitDetail{
		Commit: commit,
		Files:  files,
		Diff:   diff,
	}

	return detail, nil
}

// GetBranches retrieves all branches (local and remote)
func (s *RepositoryService) GetBranches() (*models.BranchList, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Get current branch
	currentResult, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return nil, err
	}
	currentBranch := strings.TrimSpace(currentResult.Stdout)

	// Get local branches
	localResult, err := s.executor.Execute(s.ctx, "branch", "--format=%(refname:short)|%(objectname)|%(upstream:short)")
	if err != nil {
		return nil, fmt.Errorf("failed to get local branches: %w", err)
	}

	localBranches := []models.Branch{}
	if localResult.Stdout != "" {
		lines := strings.Split(strings.TrimSpace(localResult.Stdout), "\n")
		for _, line := range lines {
			parts := strings.Split(line, "|")
			if len(parts) < 2 {
				continue
			}

			name := strings.TrimSpace(parts[0])
			commitHash := strings.TrimSpace(parts[1])
			upstream := ""
			if len(parts) > 2 {
				upstream = strings.TrimSpace(parts[2])
			}

			branch := models.Branch{
				Name:       name,
				IsHead:     name == currentBranch,
				IsRemote:   false,
				CommitHash: commitHash,
				Upstream:   upstream,
			}
			localBranches = append(localBranches, branch)
		}
	}

	// Get remote branches
	remoteResult, err := s.executor.Execute(s.ctx, "branch", "-r", "--format=%(refname:short)|%(objectname)")
	remoteBranches := []models.Branch{}
	if err == nil && remoteResult.Stdout != "" {
		lines := strings.Split(strings.TrimSpace(remoteResult.Stdout), "\n")
		for _, line := range lines {
			parts := strings.Split(line, "|")
			if len(parts) < 2 {
				continue
			}

			fullName := strings.TrimSpace(parts[0])
			commitHash := strings.TrimSpace(parts[1])

			// Skip HEAD references
			if strings.Contains(fullName, "HEAD") {
				continue
			}

			// Parse remote and branch name
			remoteParts := strings.SplitN(fullName, "/", 2)
			remote := remoteParts[0]
			name := fullName
			if len(remoteParts) > 1 {
				name = remoteParts[1]
			}

			branch := models.Branch{
				Name:       name,
				IsHead:     false,
				IsRemote:   true,
				Remote:     remote,
				CommitHash: commitHash,
			}
			remoteBranches = append(remoteBranches, branch)
		}
	}

	return &models.BranchList{
		Current: currentBranch,
		Local:   localBranches,
		Remote:  remoteBranches,
	}, nil
}

// CreateBranch creates a new branch from the current HEAD
func (s *RepositoryService) CreateBranch(branchName string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "branch", branchName)
	if err != nil {
		return fmt.Errorf("failed to create branch: %w", err)
	}

	return nil
}

// DeleteBranch deletes a branch
func (s *RepositoryService) DeleteBranch(branchName string, force bool) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	args := []string{"branch"}
	if force {
		args = append(args, "-D")
	} else {
		args = append(args, "-d")
	}
	args = append(args, branchName)

	_, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return fmt.Errorf("failed to delete branch: %w", err)
	}

	return nil
}

// CheckoutBranch switches to a different branch
func (s *RepositoryService) CheckoutBranch(branchName string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "checkout", branchName)
	if err != nil {
		return fmt.Errorf("failed to checkout branch: %w", err)
	}

	// Update repository info
	if s.repo != nil {
		s.repo.CurrentBranch = branchName
	}

	return nil
}

// GetFileContentAtCommit retrieves the full content of a file at a specific commit
func (s *RepositoryService) GetFileContentAtCommit(commitHash string, filePath string) (string, error) {
	if s.executor == nil {
		return "", fmt.Errorf("no repository opened")
	}

	result, err := s.executor.Execute(s.ctx, "show", fmt.Sprintf("%s:%s", commitHash, filePath))
	if err != nil {
		return "", fmt.Errorf("failed to get file content: %w", err)
	}

	return result.Stdout, nil
}

// CheckoutCommit checks out a specific commit (detached HEAD state)
func (s *RepositoryService) CheckoutCommit(commitHash string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "checkout", commitHash)
	if err != nil {
		return fmt.Errorf("failed to checkout commit: %w", err)
	}

	if s.repo != nil {
		s.repo.CurrentBranch = "HEAD"
		s.repo.IsDetached = true
	}

	return nil
}

// ResetBranch resets the current branch to a specific commit
func (s *RepositoryService) ResetBranch(commitHash string, mode string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	validModes := map[string]bool{"soft": true, "mixed": true, "hard": true}
	if !validModes[mode] {
		return fmt.Errorf("invalid reset mode: %s", mode)
	}

	_, err := s.executor.Execute(s.ctx, "reset", fmt.Sprintf("--%s", mode), commitHash)
	if err != nil {
		return fmt.Errorf("failed to reset branch: %w", err)
	}

	return nil
}

// RevertCommit reverts a specific commit by creating a new commit
func (s *RepositoryService) RevertCommit(commitHash string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "revert", "--no-edit", commitHash)
	if err != nil {
		return fmt.Errorf("failed to revert commit: %w", err)
	}

	return nil
}

// CherryPickCommit cherry-picks a commit onto the current branch
func (s *RepositoryService) CherryPickCommit(commitHash string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "cherry-pick", commitHash)
	if err != nil {
		return fmt.Errorf("failed to cherry-pick commit: %w", err)
	}

	return nil
}

// CreatePatchFile creates a .diff file for a specific commit
func (s *RepositoryService) CreatePatchFile(commitHash string, filename string, outputPath string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	// Generate diff from parent to commit
	// Use commitHash^..commitHash format to get diff of the commit
	diffSpec := fmt.Sprintf("%s^..%s", commitHash, commitHash)
	result, err := s.executor.Execute(s.ctx, "diff", diffSpec)
	if err != nil {
		return fmt.Errorf("failed to create patch file: %w", err)
	}

	if result.Stdout == "" {
		return fmt.Errorf("no patch generated")
	}

	// Resolve full path
	var fullPath string
	if filepath.IsAbs(outputPath) {
		fullPath = filepath.Join(outputPath, filename)
	} else {
		fullPath = filepath.Join(s.repo.Path, outputPath, filename)
	}

	// Create directory if it doesn't exist
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Write diff to file
	err = os.WriteFile(fullPath, []byte(result.Stdout), 0644)
	if err != nil {
		return fmt.Errorf("failed to write patch file: %w", err)
	}

	return nil
}

// CreateTag creates a new tag at a specific commit
func (s *RepositoryService) CreateTag(tagName string, commitHash string, message string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	args := []string{"tag"}
	if message != "" {
		args = append(args, "-a", tagName, "-m", message, commitHash)
	} else {
		args = append(args, tagName, commitHash)
	}

	_, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return fmt.Errorf("failed to create tag: %w", err)
	}

	return nil
}

// CreateBranchAtCommit creates a new branch at a specific commit
func (s *RepositoryService) CreateBranchAtCommit(branchName string, commitHash string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "branch", branchName, commitHash)
	if err != nil {
		return fmt.Errorf("failed to create branch: %w", err)
	}

	return nil
}

// GetBranchesContainingCommit gets the list of branches that contain a specific commit
func (s *RepositoryService) GetBranchesContainingCommit(commitHash string) ([]string, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	result, err := s.executor.Execute(s.ctx, "branch", "-a", "--contains", commitHash, "--format=%(refname:short)")
	if err != nil {
		return nil, fmt.Errorf("failed to get branches containing commit: %w", err)
	}

	if result.Stdout == "" {
		return []string{}, nil
	}

	branches := strings.Split(strings.TrimSpace(result.Stdout), "\n")

	// Filter out remote HEAD references and clean up remote branch names
	filteredBranches := []string{}
	for _, branch := range branches {
		branch = strings.TrimSpace(branch)
		// Skip remotes/origin/HEAD or similar
		if strings.Contains(branch, "HEAD") {
			continue
		}
		// Clean up "remotes/" prefix if present
		branch = strings.TrimPrefix(branch, "remotes/")
		filteredBranches = append(filteredBranches, branch)
	}

	return filteredBranches, nil
}
