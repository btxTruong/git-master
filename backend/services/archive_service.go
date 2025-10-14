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

// RenameArchiveByName renames an archive
func (s *ArchiveService) RenameArchiveByName(oldArchiveName string, newArchiveName string) error {
	if s.repositoryPath == "" {
		return fmt.Errorf("repository path not set")
	}

	return RenameArchive(s.repositoryPath, oldArchiveName, newArchiveName)
}

// DeleteArchiveByName removes an archive from disk
func (s *ArchiveService) DeleteArchiveByName(archiveName string) error {
	if s.repositoryPath == "" {
		return fmt.Errorf("repository path not set")
	}

	return DeleteArchive(s.repositoryPath, archiveName)
}

// RestoreOptions defines options for archive restoration
type RestoreOptions struct {
	CreateBackup  bool   // Create a stash backup before applying
	TargetGroupID string // Optional: ID of changelist group to restore into
	NewGroupName  string // Optional: name for new changelist group if creating one
	UseThreeWay   bool   // Attempt three-way merge (default: true)
	AllowReject   bool   // Allow reject files on conflict (default: true)
	ModifyIndex   bool   // Modify Git index during restore (default: false)
}

// RestoreResult contains the result of an archive restoration
type RestoreResult struct {
	Success        bool     `json:"success"`
	BackupStashRef string   `json:"backupStashRef,omitempty"` // Reference to backup stash if created
	AppliedCleanly bool     `json:"appliedCleanly"`
	RejectFiles    []string `json:"rejectFiles,omitempty"` // Paths to .rej files if conflicts occurred
	ErrorMessage   string   `json:"errorMessage,omitempty"`
	FilesAffected  []string `json:"filesAffected,omitempty"`
}

// RestoreArchiveToWorkingTree restores an archived patch to the working tree
func (s *ArchiveService) RestoreArchiveToWorkingTree(archiveName string, options RestoreOptions) (*RestoreResult, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("executor not initialized")
	}

	if s.repositoryPath == "" {
		return nil, fmt.Errorf("repository path not set")
	}

	result := &RestoreResult{
		Success: false,
	}

	// Get the diff file path
	diffFilePath, err := GetArchiveDiffPath(s.repositoryPath, archiveName)
	if err != nil {
		return nil, fmt.Errorf("failed to get diff file path: %w", err)
	}

	// Verify diff file exists
	_, err = os.Stat(diffFilePath)
	if err != nil {
		return nil, fmt.Errorf("diff file not found: %w", err)
	}

	// Get archive metadata to know which files are affected
	metadata, err := s.GetArchiveMetadata(archiveName)
	if err != nil {
		return nil, fmt.Errorf("failed to read archive metadata: %w", err)
	}

	result.FilesAffected = metadata.FilePathsList

	// Preflight check: test if patch can be applied cleanly
	canApplyCleanly, checkErr := s.preflightCheckArchive(diffFilePath)
	if checkErr != nil {
		result.ErrorMessage = fmt.Sprintf("Preflight check failed: %v", checkErr)
		return result, fmt.Errorf("preflight check failed: %w", checkErr)
	}

	// Create backup stash if requested
	if options.CreateBackup {
		stashRef, stashErr := s.createBackupStash(metadata.FilePathsList)
		if stashErr != nil {
			result.ErrorMessage = fmt.Sprintf("Failed to create backup stash: %v", stashErr)
			return result, fmt.Errorf("failed to create backup stash: %w", stashErr)
		}
		result.BackupStashRef = stashRef
	}

	// Attempt to apply the patch
	var applyErr error
	if canApplyCleanly {
		// Apply cleanly without conflicts
		applyErr = s.applyArchivePatch(diffFilePath, options.ModifyIndex, false)
		if applyErr == nil {
			result.Success = true
			result.AppliedCleanly = true
			return result, nil
		}
	}

	// If clean apply failed or wasn't possible, try three-way merge
	if options.UseThreeWay {
		applyErr = s.applyArchivePatchThreeWay(diffFilePath, options.ModifyIndex)
		if applyErr == nil {
			result.Success = true
			result.AppliedCleanly = true
			return result, nil
		}
	}

	// If three-way merge failed, fall back to reject mode
	if options.AllowReject {
		rejectFiles, rejectErr := s.applyArchivePatchWithReject(diffFilePath, options.ModifyIndex)
		if rejectErr == nil {
			result.Success = true
			result.AppliedCleanly = false
			result.RejectFiles = rejectFiles
			return result, nil
		}
		applyErr = rejectErr
	}

	// All apply strategies failed
	result.ErrorMessage = fmt.Sprintf("Failed to apply archive: %v", applyErr)

	// Rollback if backup was created
	if options.CreateBackup && result.BackupStashRef != "" {
		rollbackErr := s.rollbackFromStash(result.BackupStashRef)
		if rollbackErr != nil {
			result.ErrorMessage += fmt.Sprintf("; Rollback also failed: %v", rollbackErr)
		}
	}

	return result, fmt.Errorf("failed to apply archive: %w", applyErr)
}

// preflightCheckArchive performs a dry-run check to see if patch can be applied
func (s *ArchiveService) preflightCheckArchive(diffFilePath string) (bool, error) {
	// Use git apply --check to test if patch can be applied cleanly
	checkResult, err := s.executor.Execute(s.ctx, "apply", "--check", diffFilePath)

	// Exit code 0 means patch can be applied cleanly
	if err == nil && checkResult.ExitCode == 0 {
		return true, nil
	}

	// Non-zero exit code means conflicts or errors
	if checkResult != nil && checkResult.Stderr != "" {
		// Return false but with details about why it can't be applied
		return false, nil
	}

	// If there's an actual error (not just conflicts), return it
	if err != nil {
		return false, err
	}

	return false, nil
}

// createBackupStash creates a stash of specific files before restoration
func (s *ArchiveService) createBackupStash(filePaths []string) (string, error) {
	// Create a stash with only the affected files
	stashMessage := fmt.Sprintf("git-master: backup before archive restore at %s", time.Now().Format(time.RFC3339))

	// Use git stash push with specific paths
	args := []string{"stash", "push", "-m", stashMessage, "--"}
	args = append(args, filePaths...)

	_, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return "", fmt.Errorf("failed to create stash: %w", err)
	}

	// Get the stash reference (usually stash@{0})
	listResult, err := s.executor.Execute(s.ctx, "stash", "list", "-1", "--format=%H")
	if err != nil {
		return "", fmt.Errorf("failed to get stash reference: %w", err)
	}

	stashRef := listResult.Stdout
	if stashRef == "" {
		// If no commit hash, fall back to stash@{0}
		stashRef = "stash@{0}"
	}

	return stashRef, nil
}

// applyArchivePatch applies a patch file to the working tree
func (s *ArchiveService) applyArchivePatch(diffFilePath string, modifyIndex bool, binary bool) error {
	args := []string{"apply"}

	if modifyIndex {
		args = append(args, "--index")
	}

	if binary {
		args = append(args, "--binary")
	}

	args = append(args, diffFilePath)

	_, err := s.executor.Execute(s.ctx, args...)
	return err
}

// applyArchivePatchThreeWay applies a patch using three-way merge
func (s *ArchiveService) applyArchivePatchThreeWay(diffFilePath string, modifyIndex bool) error {
	args := []string{"apply", "--3way"}

	if modifyIndex {
		args = append(args, "--index")
	}

	args = append(args, diffFilePath)

	_, err := s.executor.Execute(s.ctx, args...)
	return err
}

// applyArchivePatchWithReject applies a patch with reject mode, creating .rej files for conflicts
func (s *ArchiveService) applyArchivePatchWithReject(diffFilePath string, modifyIndex bool) ([]string, error) {
	args := []string{"apply", "--reject"}

	if modifyIndex {
		args = append(args, "--index")
	}

	args = append(args, diffFilePath)

	result, err := s.executor.Execute(s.ctx, args...)

	// Even with --reject, git apply returns non-zero if there were conflicts
	// But the patch is still partially applied with .rej files created
	// Parse the output to find reject files
	rejectFiles := parseRejectFiles(result.Stderr)

	// If there are reject files, consider it a partial success
	if len(rejectFiles) > 0 {
		return rejectFiles, nil
	}

	// If no reject files and there was an error, it's a real failure
	if err != nil {
		return nil, err
	}

	return []string{}, nil
}

// parseRejectFiles extracts reject file paths from git apply output
func parseRejectFiles(output string) []string {
	rejectFiles := []string{}
	lines := splitLines(output)

	for _, line := range lines {
		// Look for lines like: "Rejected hunk #1 from file.txt"
		// or "file.txt.rej created"
		if len(line) > 4 && (contains(line, ".rej") || contains(line, "Rejected")) {
			// Extract the file path
			// This is a simple heuristic; adjust based on actual git output
			parts := splitOnWhitespace(line)
			for _, part := range parts {
				if contains(part, ".rej") {
					rejectFiles = append(rejectFiles, part)
					break
				}
			}
		}
	}

	return rejectFiles
}

// rollbackFromStash rolls back changes using a stash reference
func (s *ArchiveService) rollbackFromStash(stashRef string) error {
	// Pop the stash to restore the backup
	_, err := s.executor.Execute(s.ctx, "stash", "pop", stashRef)
	return err
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && findSubstring(s, substr) >= 0
}

// findSubstring finds the index of a substring in a string
func findSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if s[i+j] != substr[j] {
				match = false
				break
			}
		}
		if match {
			return i
		}
	}
	return -1
}

// splitOnWhitespace splits a string on whitespace characters
func splitOnWhitespace(s string) []string {
	parts := []string{}
	current := ""

	for i := 0; i < len(s); i++ {
		if s[i] == ' ' || s[i] == '\t' || s[i] == '\n' || s[i] == '\r' {
			if current != "" {
				parts = append(parts, current)
				current = ""
			}
		} else {
			current += string(s[i])
		}
	}

	if current != "" {
		parts = append(parts, current)
	}

	return parts
}
