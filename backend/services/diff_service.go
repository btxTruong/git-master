package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"git-master/backend/models"
	"strings"
)

// DiffService handles generating Git diffs for changelist groups
type DiffService struct {
	ctx      context.Context
	executor *git.Executor
}

// NewDiffService creates a new DiffService instance
func NewDiffService() *DiffService {
	return &DiffService{}
}

// Startup initializes the service with a context
func (s *DiffService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetExecutor sets the Git executor for this service
func (s *DiffService) SetExecutor(executor *git.Executor) {
	s.executor = executor
}

// GetChangelistGroupDiff generates a complete diff for all files in a changelist group
func (s *DiffService) GetChangelistGroupDiff(changelist *models.Changelist, stagingService *StagingService) (string, error) {
	if s.executor == nil {
		return "", fmt.Errorf("executor not initialized")
	}

	if changelist == nil {
		return "", fmt.Errorf("changelist cannot be nil")
	}

	if len(changelist.FileItems) == 0 {
		return "", fmt.Errorf("changelist has no files")
	}

	// Get file statuses for all files in the changelist
	filePaths := make([]string, len(changelist.FileItems))
	for i, item := range changelist.FileItems {
		filePaths[i] = item.FilePath
	}

	fileStatuses, err := stagingService.GetStatusForSpecificFilePaths(filePaths)
	if err != nil {
		return "", fmt.Errorf("failed to get file statuses: %w", err)
	}

	// Create a map of file paths to their statuses for quick lookup
	statusMap := make(map[string]FileStatus)
	for _, fs := range fileStatuses {
		statusMap[fs.Path] = fs
	}

	var diffs []string

	// Generate diff for each file in the changelist
	for _, item := range changelist.FileItems {
		fileStatus, exists := statusMap[item.FilePath]
		if !exists {
			// File not in current status - might be missing or already committed
			continue
		}

		fileDiff, err := s.generateDiffForFileStatus(item.FilePath, fileStatus)
		if err != nil {
			// Log error but continue with other files
			continue
		}

		if fileDiff != "" {
			diffs = append(diffs, fileDiff)
		}
	}

	if len(diffs) == 0 {
		return "", fmt.Errorf("no diffs generated for changelist")
	}

	// Combine all diffs with double newline separator
	return strings.Join(diffs, "\n\n"), nil
}

// GetSingleFileDiff generates a diff for a single file
func (s *DiffService) GetSingleFileDiff(filePath string, stagingService *StagingService) (string, error) {
	if s.executor == nil {
		return "", fmt.Errorf("executor not initialized")
	}

	// Get the file status
	fileStatuses, err := stagingService.GetStatusForSpecificFilePaths([]string{filePath})
	if err != nil {
		return "", fmt.Errorf("failed to get file status: %w", err)
	}

	if len(fileStatuses) == 0 {
		return "", fmt.Errorf("file not found in working directory status")
	}

	return s.generateDiffForFileStatus(filePath, fileStatuses[0])
}

// generateDiffForFileStatus generates a diff for a file based on its status
func (s *DiffService) generateDiffForFileStatus(filePath string, fileStatus FileStatus) (string, error) {
	// Determine file state and generate appropriate diff
	if fileStatus.Staged {
		// File is staged - generate diff from index vs HEAD
		return s.generateStagedFileDiff(filePath)
	} else if fileStatus.Status == "?" {
		// File is untracked - generate diff from /dev/null
		return s.generateUntrackedFileDiff(filePath)
	} else {
		// File is modified but not staged - generate diff from working tree vs HEAD
		return s.generateModifiedFileDiff(filePath)
	}
}

// generateStagedFileDiff generates a diff for a staged file (index vs HEAD)
func (s *DiffService) generateStagedFileDiff(filePath string) (string, error) {
	// Use --staged (or --cached) to diff index vs HEAD
	// Use --binary to handle binary files correctly
	// Use -c core.quotepath=false to avoid octal escapes in file paths
	result, err := s.executor.Execute(
		s.ctx,
		"-c", "core.quotepath=false",
		"diff",
		"--staged",
		"--binary",
		"--",
		filePath,
	)

	if err != nil {
		return "", fmt.Errorf("failed to generate staged diff for %s: %w", filePath, err)
	}

	return result.Stdout, nil
}

// generateModifiedFileDiff generates a diff for a modified tracked file (working tree vs HEAD)
func (s *DiffService) generateModifiedFileDiff(filePath string) (string, error) {
	// Generate diff from working tree vs HEAD
	// Use --binary to handle binary files correctly
	// Use -c core.quotepath=false to avoid octal escapes in file paths
	result, err := s.executor.Execute(
		s.ctx,
		"-c", "core.quotepath=false",
		"diff",
		"--binary",
		"--",
		filePath,
	)

	if err != nil {
		return "", fmt.Errorf("failed to generate modified diff for %s: %w", filePath, err)
	}

	return result.Stdout, nil
}

// generateUntrackedFileDiff generates a diff for an untracked file (working tree vs /dev/null)
func (s *DiffService) generateUntrackedFileDiff(filePath string) (string, error) {
	// For untracked files, compare against /dev/null to show the entire file as new
	// Use --no-index to compare files outside the repository context
	// Use --binary to handle binary files correctly
	// Use -c core.quotepath=false to avoid octal escapes in file paths
	result, err := s.executor.Execute(
		s.ctx,
		"-c", "core.quotepath=false",
		"diff",
		"--no-index",
		"--binary",
		"--",
		"/dev/null",
		filePath,
	)

	// git diff --no-index returns exit code 1 when files differ, which is expected
	// We only care about the output, not the exit code for this operation
	if result != nil && result.Stdout != "" {
		return result.Stdout, nil
	}

	if err != nil {
		// If we have output despite error, use it
		if result != nil && result.Stdout != "" {
			return result.Stdout, nil
		}
		return "", fmt.Errorf("failed to generate untracked diff for %s: %w", filePath, err)
	}

	return result.Stdout, nil
}
