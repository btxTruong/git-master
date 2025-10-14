package services

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
)

// StagingService handles Git staging operations
type StagingService struct {
	ctx  context.Context
	repo *RepositoryService
}

// NewStagingService creates a new StagingService instance
func NewStagingService(repo *RepositoryService) *StagingService {
	return &StagingService{
		ctx:  context.Background(),
		repo: repo,
	}
}

// FileStatus represents the status of a file in the working directory
type FileStatus struct {
	Path     string `json:"path"`
	Status   string `json:"status"`   // 'M' (modified), 'A' (added), 'D' (deleted), '?' (untracked), etc.
	Staged   bool   `json:"staged"`   // true if the file is staged
	Modified bool   `json:"modified"` // true if the file has modifications
}

// WorkingDirectoryStatus represents the current status of the working directory
type WorkingDirectoryStatus struct {
	StagedFiles    []FileStatus `json:"stagedFiles"`
	UnstagedFiles  []FileStatus `json:"unstagedFiles"`
	UntrackedFiles []FileStatus `json:"untrackedFiles"`
}

// GetStatus returns the current working directory status
func (s *StagingService) GetStatus() (*WorkingDirectoryStatus, error) {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return nil, fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	// Run git status --porcelain to get file statuses
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get git status: %w", err)
	}

	return s.parseStatus(string(output))
}

// parseStatus parses the output of git status --porcelain
func (s *StagingService) parseStatus(output string) (*WorkingDirectoryStatus, error) {
	status := &WorkingDirectoryStatus{
		StagedFiles:    []FileStatus{},
		UnstagedFiles:  []FileStatus{},
		UntrackedFiles: []FileStatus{},
	}

	if output == "" {
		return status, nil
	}

	lines := strings.Split(strings.TrimSpace(output), "\n")
	for _, line := range lines {
		if len(line) < 4 {
			continue
		}

		// Git status --porcelain format:
		// XY PATH
		// X = status of index (staged)
		// Y = status of working tree (unstaged)
		indexStatus := line[0]
		workTreeStatus := line[1]
		path := strings.TrimSpace(line[3:])

		fileStatus := FileStatus{
			Path:   path,
			Status: string([]byte{indexStatus, workTreeStatus}),
		}

		// Determine which category the file belongs to
		if indexStatus != ' ' && indexStatus != '?' {
			// File is staged
			fileStatus.Staged = true
			fileStatus.Status = string(indexStatus)
			status.StagedFiles = append(status.StagedFiles, fileStatus)

			// If working tree also has changes, add to unstaged too
			if workTreeStatus != ' ' && workTreeStatus != '?' {
				unstagedFile := FileStatus{
					Path:     path,
					Status:   string(workTreeStatus),
					Staged:   false,
					Modified: true,
				}
				status.UnstagedFiles = append(status.UnstagedFiles, unstagedFile)
			}
		} else if workTreeStatus == '?' {
			// Untracked file
			fileStatus.Staged = false
			fileStatus.Status = "?"
			status.UntrackedFiles = append(status.UntrackedFiles, fileStatus)
		} else if workTreeStatus != ' ' {
			// Modified in working tree but not staged
			fileStatus.Staged = false
			fileStatus.Modified = true
			fileStatus.Status = string(workTreeStatus)
			status.UnstagedFiles = append(status.UnstagedFiles, fileStatus)
		}
	}

	return status, nil
}

// StageFile stages a single file
func (s *StagingService) StageFile(path string) error {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	cmd := exec.Command("git", "add", path)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to stage file %s: %w - %s", path, err, string(output))
	}

	return nil
}

// UnstageFile unstages a single file
func (s *StagingService) UnstageFile(path string) error {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	cmd := exec.Command("git", "reset", "HEAD", path)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to unstage file %s: %w - %s", path, err, string(output))
	}

	return nil
}

// StageAll stages all changes (including untracked files)
func (s *StagingService) StageAll() error {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	cmd := exec.Command("git", "add", "-A")
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to stage all files: %w - %s", err, string(output))
	}

	return nil
}

// UnstageAll unstages all staged changes
func (s *StagingService) UnstageAll() error {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	cmd := exec.Command("git", "reset", "HEAD")
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to unstage all files: %w - %s", err, string(output))
	}

	return nil
}

// GetFileDiff returns the diff for a specific file
func (s *StagingService) GetFileDiff(path string, staged bool) (string, error) {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return "", fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	var cmd *exec.Cmd
	if staged {
		// Get diff for staged changes
		cmd = exec.Command("git", "diff", "--cached", path)
	} else {
		// Get diff for unstaged changes
		cmd = exec.Command("git", "diff", path)
	}
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get file diff for %s: %w", path, err)
	}

	return string(output), nil
}

// Commit creates a new commit with the staged changes
func (s *StagingService) Commit(message string, amend bool) error {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	// Validate message
	if strings.TrimSpace(message) == "" {
		return fmt.Errorf("commit message cannot be empty")
	}

	args := []string{"commit", "-m", message}
	if amend {
		args = []string{"commit", "--amend", "-m", message}
	}

	cmd := exec.Command("git", args...)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to commit: %w - %s", err, string(output))
	}

	return nil
}

// Batch Operations

// StageMultipleFilePaths stages multiple file paths in a single Git operation
func (s *StagingService) StageMultipleFilePaths(filePathsToStage []string) error {
	// Handle empty list
	if len(filePathsToStage) == 0 {
		return nil
	}

	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	// Build git add command with all paths
	args := append([]string{"add", "--"}, filePathsToStage...)
	cmd := exec.Command("git", args...)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to stage multiple files: %w - %s", err, string(output))
	}

	return nil
}

// UnstageMultipleFilePaths unstages multiple file paths in a single Git operation
func (s *StagingService) UnstageMultipleFilePaths(filePathsToUnstage []string) error {
	// Handle empty list
	if len(filePathsToUnstage) == 0 {
		return nil
	}

	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	// Build git reset command with all paths
	args := append([]string{"reset", "HEAD", "--"}, filePathsToUnstage...)
	cmd := exec.Command("git", args...)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to unstage multiple files: %w - %s", err, string(output))
	}

	return nil
}

// GetStatusForSpecificFilePaths returns Git status for a specific subset of files
func (s *StagingService) GetStatusForSpecificFilePaths(filePathsToQuery []string) ([]FileStatus, error) {
	// Handle empty list
	if len(filePathsToQuery) == 0 {
		return []FileStatus{}, nil
	}

	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return nil, fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	// Build git status command for specific paths
	args := append([]string{"status", "--porcelain", "--"}, filePathsToQuery...)
	cmd := exec.Command("git", args...)
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get status for specific files: %w", err)
	}

	// Reuse existing parseStatus logic
	workingDirectoryStatus, parseError := s.parseStatus(string(output))
	if parseError != nil {
		return nil, parseError
	}

	// Combine all file statuses into a single list
	allFileStatuses := make([]FileStatus, 0)
	allFileStatuses = append(allFileStatuses, workingDirectoryStatus.StagedFiles...)
	allFileStatuses = append(allFileStatuses, workingDirectoryStatus.UnstagedFiles...)
	allFileStatuses = append(allFileStatuses, workingDirectoryStatus.UntrackedFiles...)

	return allFileStatuses, nil
}

// RevertOptions specifies what changes to revert for a file
type RevertOptions struct {
	RevertStagedChanges   bool // Revert staged changes
	RevertUnstagedChanges bool // Revert working tree changes
	DeleteUntrackedFiles  bool // Delete if untracked
}

// RevertFileChanges reverts changes to a file based on the specified options
func (s *StagingService) RevertFileChanges(filePath string, options RevertOptions) error {
	repo := s.repo.GetCurrentRepository()
	if repo == nil {
		return fmt.Errorf("no repository is currently open")
	}
	repoPath := repo.Path

	// Revert staged changes
	if options.RevertStagedChanges {
		cmd := exec.Command("git", "restore", "--staged", "--", filePath)
		cmd.Dir = repoPath

		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to revert staged changes for %s: %w - %s", filePath, err, string(output))
		}
	}

	// Revert unstaged changes
	if options.RevertUnstagedChanges {
		cmd := exec.Command("git", "restore", "--source", "HEAD", "--", filePath)
		cmd.Dir = repoPath

		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to revert unstaged changes for %s: %w - %s", filePath, err, string(output))
		}
	}

	// Delete untracked file
	if options.DeleteUntrackedFiles {
		cmd := exec.Command("git", "clean", "-f", "--", filePath)
		cmd.Dir = repoPath

		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to delete untracked file %s: %w - %s", filePath, err, string(output))
		}
	}

	return nil
}
