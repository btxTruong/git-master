package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"git-master/backend/models"
	"strings"
)

// BlameService handles git blame operations
type BlameService struct {
	ctx      context.Context
	executor *git.Executor
}

// NewBlameService creates a new blame service
func NewBlameService() *BlameService {
	return &BlameService{}
}

// Startup is called when the app starts
func (s *BlameService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetExecutor sets the git executor
func (s *BlameService) SetExecutor(executor *git.Executor) {
	s.executor = executor
}

// GetBlame retrieves blame information for a file
func (s *BlameService) GetBlame(filePath string) (*models.BlameResult, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Check if file exists in git history
	// Using ls-files to check if file is tracked
	lsResult, err := s.executor.Execute(s.ctx, "ls-files", "--error-unmatch", filePath)
	if err != nil || lsResult.ExitCode != 0 {
		return nil, fmt.Errorf("file not in git history: %s", filePath)
	}

	// Execute git blame with porcelain format for easy parsing
	result, err := s.executor.Execute(s.ctx, "blame", "--line-porcelain", filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to get blame: %w", err)
	}

	lines, err := parseBlameOutput(result.Stdout)
	if err != nil {
		return nil, fmt.Errorf("failed to parse blame output: %w", err)
	}

	return &models.BlameResult{
		FilePath: filePath,
		Lines:    lines,
	}, nil
}

// GetBlameForCommit retrieves blame information for a file at a specific commit
func (s *BlameService) GetBlameForCommit(filePath string, commitHash string) (*models.BlameResult, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Execute git blame for the specific commit with porcelain format
	result, err := s.executor.Execute(s.ctx, "blame", "--line-porcelain", commitHash, "--", filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to get blame for commit: %w", err)
	}

	lines, err := parseBlameOutput(result.Stdout)
	if err != nil {
		return nil, fmt.Errorf("failed to parse blame output: %w", err)
	}

	return &models.BlameResult{
		FilePath: filePath,
		Lines:    lines,
	}, nil
}

// parseBlameOutput parses the porcelain format output from git blame
func parseBlameOutput(output string) ([]models.BlameLine, error) {
	if output == "" {
		return []models.BlameLine{}, nil
	}

	lines := strings.Split(output, "\n")
	var blameLines []models.BlameLine
	var currentLine *models.BlameLine
	lineNumber := 0

	for i := 0; i < len(lines); i++ {
		line := lines[i]

		// Skip empty lines
		if line == "" {
			continue
		}

		// First line of each block: commit hash, original line, final line, num lines
		if !strings.HasPrefix(line, "\t") && len(strings.Fields(line)) >= 3 {
			parts := strings.Fields(line)
			commitHash := parts[0]

			lineNumber++
			currentLine = &models.BlameLine{
				LineNumber: lineNumber,
				CommitHash: commitHash,
				ShortHash:  commitHash[:7], // Short hash is first 7 chars
			}
			continue
		}

		if currentLine == nil {
			continue
		}

		// Parse metadata lines
		if strings.HasPrefix(line, "author ") {
			currentLine.Author = strings.TrimPrefix(line, "author ")
		} else if strings.HasPrefix(line, "author-mail ") {
			email := strings.TrimPrefix(line, "author-mail ")
			// Remove < and > from email
			email = strings.TrimPrefix(email, "<")
			email = strings.TrimSuffix(email, ">")
			currentLine.AuthorEmail = email
		} else if strings.HasPrefix(line, "author-time ") {
			timeStr := strings.TrimPrefix(line, "author-time ")
			currentLine.AuthorTime = timeStr
		} else if strings.HasPrefix(line, "committer ") {
			currentLine.CommitterName = strings.TrimPrefix(line, "committer ")
		} else if strings.HasPrefix(line, "committer-mail ") {
			email := strings.TrimPrefix(line, "committer-mail ")
			email = strings.TrimPrefix(email, "<")
			email = strings.TrimSuffix(email, ">")
			currentLine.CommitterEmail = email
		} else if strings.HasPrefix(line, "committer-time ") {
			timeStr := strings.TrimPrefix(line, "committer-time ")
			currentLine.CommitterTime = timeStr
		} else if strings.HasPrefix(line, "summary ") {
			currentLine.Summary = strings.TrimPrefix(line, "summary ")
		} else if strings.HasPrefix(line, "\t") {
			// This is the actual line content
			currentLine.Content = strings.TrimPrefix(line, "\t")
			blameLines = append(blameLines, *currentLine)
			currentLine = nil
		}
	}

	return blameLines, nil
}
