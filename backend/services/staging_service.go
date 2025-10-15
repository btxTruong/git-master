package services

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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

	status, err := s.parseStatus(string(output))
	if err != nil {
		return nil, err
	}

	// For untracked directories, expand to show individual files
	// git status --porcelain shows directories with trailing /, but we want individual files
	expandedUntracked := []FileStatus{}
	for _, file := range status.UntrackedFiles {
		// Check if this is a directory (ends with /)
		if strings.HasSuffix(file.Path, "/") {
			// Get individual files in this directory
			lsCmd := exec.Command("git", "ls-files", "--others", "--exclude-standard", file.Path)
			lsCmd.Dir = repoPath
			lsOutput, lsErr := lsCmd.Output()
			if lsErr == nil && len(lsOutput) > 0 {
				// Add each file individually
				files := strings.Split(strings.TrimSpace(string(lsOutput)), "\n")
				for _, f := range files {
					if f != "" {
						expandedUntracked = append(expandedUntracked, FileStatus{
							Path:   f,
							Status: "?",
							Staged: false,
						})
					}
				}
			} else {
				// If we can't expand, keep the directory entry
				expandedUntracked = append(expandedUntracked, file)
			}
		} else {
			// Regular file, keep it
			expandedUntracked = append(expandedUntracked, file)
		}
	}
	status.UntrackedFiles = expandedUntracked

	return status, nil
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

	lines := strings.Split(output, "\n")
	for _, line := range lines {
		// Skip empty lines or lines that are too short
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

	// Check if the file exists in the working directory
	fullPath := filepath.Join(repoPath, path)
	_, statErr := os.Stat(fullPath)
	fileExists := statErr == nil

	var cmd *exec.Cmd
	if fileExists {
		// File exists: use 'git add' with '--all' flag to stage changes
		cmd = exec.Command("git", "add", "--all", path)
	} else {
		// File doesn't exist: it's been deleted, use 'git rm' to stage the deletion
		cmd = exec.Command("git", "rm", path)
	}
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

	// First check if file is untracked
	statusCmd := exec.Command("git", "status", "--porcelain", "--", path)
	statusCmd.Dir = repoPath
	statusOutput, err := statusCmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to check file status: %w", err)
	}

	// If file is untracked (starts with ??)
	statusStr := strings.TrimSpace(string(statusOutput))
	if strings.HasPrefix(statusStr, "??") {
		// For untracked files, read file content directly from filesystem
		fullPath := filepath.Join(repoPath, path)
		fileContent, readErr := os.ReadFile(fullPath)
		if readErr != nil {
			return "", fmt.Errorf("failed to read untracked file %s: %w", path, readErr)
		}

		// Return a pseudo-diff showing entire file as added
		lines := strings.Split(string(fileContent), "\n")
		var pseudoDiff strings.Builder
		pseudoDiff.WriteString("diff --git a/" + path + " b/" + path + "\n")
		pseudoDiff.WriteString("new file mode 100644\n")
		pseudoDiff.WriteString("--- /dev/null\n")
		pseudoDiff.WriteString("+++ b/" + path + "\n")
		pseudoDiff.WriteString("@@ -0,0 +1," + fmt.Sprintf("%d", len(lines)) + " @@\n")
		for _, line := range lines {
			pseudoDiff.WriteString("+" + line + "\n")
		}
		return pseudoDiff.String(), nil
	}

	// For tracked files (including deleted), use git diff
	var cmd *exec.Cmd
	if staged {
		// Get diff for staged changes
		// Use HEAD as comparison point to show what was deleted
		cmd = exec.Command("git", "diff", "--cached", "HEAD", "--", path)
	} else {
		// Get diff for unstaged changes
		// Compare working tree with index
		cmd = exec.Command("git", "diff", "HEAD", "--", path)
	}
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get file diff for %s: %w", path, err)
	}

	// If output is empty, the file might be deleted - try getting diff from HEAD
	if len(output) == 0 || strings.TrimSpace(string(output)) == "" {
		// Try getting the full diff including deletions
		cmd = exec.Command("git", "diff", "HEAD", "--", path)
		cmd.Dir = repoPath
		output, err = cmd.Output()
		if err != nil {
			return "", fmt.Errorf("failed to get file diff for deleted file %s: %w", path, err)
		}
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

	// Separate files into existing and deleted
	existingFiles := []string{}
	deletedFiles := []string{}

	for _, path := range filePathsToStage {
		fullPath := filepath.Join(repoPath, path)
		_, statErr := os.Stat(fullPath)
		if statErr == nil {
			existingFiles = append(existingFiles, path)
		} else {
			deletedFiles = append(deletedFiles, path)
		}
	}

	// Stage existing files with git add
	if len(existingFiles) > 0 {
		args := append([]string{"add", "--all", "--"}, existingFiles...)
		cmd := exec.Command("git", args...)
		cmd.Dir = repoPath

		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to stage existing files: %w - %s", err, string(output))
		}
	}

	// Stage deleted files with git rm
	if len(deletedFiles) > 0 {
		args := append([]string{"rm", "--"}, deletedFiles...)
		cmd := exec.Command("git", args...)
		cmd.Dir = repoPath

		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("failed to stage deleted files: %w - %s", err, string(output))
		}
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
