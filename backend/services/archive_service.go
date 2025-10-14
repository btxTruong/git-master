package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"git-master/backend/models"
	"os"
	"time"

	"github.com/google/uuid"
)

// ArchiveService handles archive operations for changelist groups
type ArchiveService struct {
	ctx            context.Context
	executor       *git.Executor
	repositoryPath string
	diffService    *DiffService
	stagingService *StagingService
}

// NewArchiveService creates a new ArchiveService instance
func NewArchiveService(diffService *DiffService, stagingService *StagingService) *ArchiveService {
	return &ArchiveService{
		diffService:    diffService,
		stagingService: stagingService,
	}
}

// Startup initializes the service with a context
func (s *ArchiveService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetExecutor sets the Git executor for this service
func (s *ArchiveService) SetExecutor(executor *git.Executor) {
	s.executor = executor
}

// SetRepositoryPath sets the repository path for archive operations
func (s *ArchiveService) SetRepositoryPath(repositoryPath string) {
	s.repositoryPath = repositoryPath
}

// ArchiveChangelistGroup creates an archive from a changelist group
func (s *ArchiveService) ArchiveChangelistGroup(changelist *models.Changelist, archiveName string, description string, tags []string) (*models.ArchiveMetadata, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("executor not initialized")
	}

	if s.repositoryPath == "" {
		return nil, fmt.Errorf("repository path not set")
	}

	if changelist == nil {
		return nil, fmt.Errorf("changelist cannot be nil")
	}

	if len(changelist.FileItems) == 0 {
		return nil, fmt.Errorf("changelist has no files to archive")
	}

	// Ensure archive directory exists
	err := EnsureArchiveDirectoryExists(s.repositoryPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create archive directory: %w", err)
	}

	// Get unique archive name
	uniqueArchiveName, err := GetUniqueArchiveName(s.repositoryPath, archiveName)
	if err != nil {
		return nil, fmt.Errorf("failed to generate unique archive name: %w", err)
	}

	// Get current branch and commit
	currentBranch, currentCommit, err := s.getCurrentBranchAndCommit()
	if err != nil {
		return nil, fmt.Errorf("failed to get current branch and commit: %w", err)
	}

	// Generate unified diff for all files in changelist
	unifiedDiff, err := s.diffService.GetChangelistGroupDiff(changelist, s.stagingService)
	if err != nil {
		return nil, fmt.Errorf("failed to generate diff: %w", err)
	}

	// Get archive file path
	diffFilePath, err := GetArchiveDiffPath(s.repositoryPath, uniqueArchiveName)
	if err != nil {
		return nil, fmt.Errorf("failed to get diff file path: %w", err)
	}

	// Write diff file first
	err = os.WriteFile(diffFilePath, []byte(unifiedDiff), FilePermissions)
	if err != nil {
		return nil, fmt.Errorf("failed to write diff file: %w", err)
	}

	// Get diff file size
	diffFileInfo, err := os.Stat(diffFilePath)
	if err != nil {
		// Clean up diff file on error
		os.Remove(diffFilePath)
		return nil, fmt.Errorf("failed to get diff file info: %w", err)
	}

	// Calculate diff statistics
	totalAdditions, totalDeletions := calculateDiffStatistics(unifiedDiff)

	// Extract file paths from changelist
	filePaths := make([]string, len(changelist.FileItems))
	for i, item := range changelist.FileItems {
		filePaths[i] = item.FilePath
	}

	// Create metadata
	now := time.Now()
	metadata := &models.ArchiveMetadata{
		ArchiveIdentifier:   uuid.New().String(),
		OriginalGroupName:   changelist.GroupName,
		ArchiveName:         uniqueArchiveName,
		CreatedAtTimestamp:  changelist.CreatedAtTimestamp,
		ArchivedAtTimestamp: now,
		FilePathsList:       filePaths,
		OriginalBranchName:  currentBranch,
		OriginalCommitHash:  currentCommit,
		DescriptionText:     description,
		TagsList:            tags,
		DiffFileSizeBytes:   diffFileInfo.Size(),
		TotalFilesCount:     len(filePaths),
		TotalAdditionsCount: totalAdditions,
		TotalDeletionsCount: totalDeletions,
	}

	// Write metadata file
	err = WriteArchiveMetadata(s.repositoryPath, uniqueArchiveName, metadata)
	if err != nil {
		// Clean up diff file on error
		os.Remove(diffFilePath)
		return nil, fmt.Errorf("failed to write metadata file: %w", err)
	}

	return metadata, nil
}

// getCurrentBranchAndCommit gets the current Git branch and commit hash
func (s *ArchiveService) getCurrentBranchAndCommit() (string, string, error) {
	// Get current branch
	branchResult, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return "", "", fmt.Errorf("failed to get current branch: %w", err)
	}
	currentBranch := branchResult.Stdout

	// Get current commit hash
	commitResult, err := s.executor.Execute(s.ctx, "rev-parse", "HEAD")
	if err != nil {
		return "", "", fmt.Errorf("failed to get current commit: %w", err)
	}
	currentCommit := commitResult.Stdout

	return currentBranch, currentCommit, nil
}

// calculateDiffStatistics calculates the total number of additions and deletions in a diff
func calculateDiffStatistics(diffContent string) (int, int) {
	additions := 0
	deletions := 0

	lines := splitLines(diffContent)
	for _, line := range lines {
		if len(line) == 0 {
			continue
		}

		// Count additions and deletions based on line prefix
		if line[0] == '+' && !isFileHeader(line) {
			additions++
		} else if line[0] == '-' && !isFileHeader(line) {
			deletions++
		}
	}

	return additions, deletions
}

// isFileHeader checks if a line is a diff header line (not actual content)
func isFileHeader(line string) bool {
	if len(line) < 4 {
		return false
	}

	// Check for common diff header patterns
	return (line[:3] == "+++" || line[:3] == "---" ||
		line[:4] == "diff" || line[:5] == "index")
}

// splitLines splits a string into lines
func splitLines(s string) []string {
	if s == "" {
		return []string{}
	}

	lines := []string{}
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}

	// Add the last line if it doesn't end with newline
	if start < len(s) {
		lines = append(lines, s[start:])
	}

	return lines
}

// GetArchiveList returns all archives for the current repository
func (s *ArchiveService) GetArchiveList() ([]models.ArchiveListEntry, error) {
	if s.repositoryPath == "" {
		return nil, fmt.Errorf("repository path not set")
	}

	return ListAllArchivesForRepository(s.repositoryPath)
}

// GetArchiveMetadata retrieves metadata for a specific archive
func (s *ArchiveService) GetArchiveMetadata(archiveName string) (*models.ArchiveMetadata, error) {
	if s.repositoryPath == "" {
		return nil, fmt.Errorf("repository path not set")
	}

	return ReadArchiveMetadata(s.repositoryPath, archiveName)
}

// GetArchiveDiffContent retrieves the diff content for a specific archive
func (s *ArchiveService) GetArchiveDiffContent(archiveName string) (string, error) {
	if s.repositoryPath == "" {
		return "", fmt.Errorf("repository path not set")
	}

	diffFilePath, err := GetArchiveDiffPath(s.repositoryPath, archiveName)
	if err != nil {
		return "", err
	}

	diffBytes, err := os.ReadFile(diffFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to read diff file: %w", err)
	}

	return string(diffBytes), nil
}

// DeleteArchiveByName removes an archive from disk
func (s *ArchiveService) DeleteArchiveByName(archiveName string) error {
	if s.repositoryPath == "" {
		return fmt.Errorf("repository path not set")
	}

	return DeleteArchive(s.repositoryPath, archiveName)
}
