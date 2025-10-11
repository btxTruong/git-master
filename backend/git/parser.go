package git

import (
	"git-master/backend/models"
	"strings"
	"time"
)

// ParseCommits parses git log output into Commit objects
// Expected format: hash|shortHash|authorName|authorEmail|committerName|committerEmail|timestamp|refs|subject
func ParseCommits(output string) ([]models.Commit, error) {
	if output == "" {
		return []models.Commit{}, nil
	}

	lines := strings.Split(strings.TrimSpace(output), "\n")
	commits := make([]models.Commit, 0, len(lines))

	for _, line := range lines {
		parts := strings.Split(line, "|")
		if len(parts) < 9 {
			continue
		}

		timestamp, err := time.Parse("2006-01-02 15:04:05 -0700", parts[6])
		if err != nil {
			timestamp = time.Now()
		}

		// Parse refs (branch names, tags)
		refs := []string{}
		if parts[7] != "" {
			refStr := strings.Trim(parts[7], " ()")
			if refStr != "" {
				refs = strings.Split(refStr, ", ")
			}
		}

		// Join all parts from index 8 onwards to handle commit messages with | characters
		message := strings.Join(parts[8:], "|")

		commit := models.Commit{
			Hash:      parts[0],
			ShortHash: parts[1],
			Author: models.Author{
				Name:  parts[2],
				Email: parts[3],
			},
			Committer: models.Author{
				Name:  parts[4],
				Email: parts[5],
			},
			Date:         timestamp,
			Refs:         refs,
			ShortMessage: message,
			Message:      message,
		}

		commits = append(commits, commit)
	}

	return commits, nil
}

// ParseBranches parses git branch output into Branch objects
func ParseBranches(output string, isRemote bool) ([]models.Branch, error) {
	if output == "" {
		return []models.Branch{}, nil
	}

	lines := strings.Split(strings.TrimSpace(output), "\n")
	branches := make([]models.Branch, 0, len(lines))

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		isHead := strings.HasPrefix(line, "*")
		line = strings.TrimPrefix(line, "* ")
		line = strings.TrimSpace(line)

		// Skip detached HEAD state
		if strings.HasPrefix(line, "(HEAD detached") || strings.HasPrefix(line, "(no branch") {
			continue
		}

		branch := models.Branch{
			Name:     line,
			IsHead:   isHead,
			IsRemote: isRemote,
		}

		// Parse remote name for remote branches
		if isRemote && strings.Contains(line, "/") {
			parts := strings.SplitN(line, "/", 2)
			if len(parts) == 2 {
				branch.Remote = parts[0]
				branch.Name = parts[1]
			}
		}

		branches = append(branches, branch)
	}

	return branches, nil
}

// ParseFileStatus parses git status porcelain output
func ParseFileStatus(output string) (staged, unstaged, untracked []string) {
	if output == "" {
		return
	}

	lines := strings.Split(strings.TrimSpace(output), "\n")

	for _, line := range lines {
		if len(line) < 4 {
			continue
		}

		statusCode := line[0:2]
		filePath := line[3:]

		// X          Y     Meaning
		// -------------------------------------------------
		//          [AMD]   not updated
		// M        [ MD]   updated in index
		// A        [ MD]   added to index
		// D                deleted from index
		// R        [ MD]   renamed in index
		// C        [ MD]   copied in index
		// [MARC]           index and work tree matches
		// [ MARC]     M    work tree changed since index
		// [ MARC]     D    deleted in work tree
		// -------------------------------------------------
		// D           D    unmerged, both deleted
		// A           U    unmerged, added by us
		// U           D    unmerged, deleted by them
		// U           A    unmerged, added by them
		// D           U    unmerged, deleted by us
		// A           A    unmerged, both added
		// U           U    unmerged, both modified
		// -------------------------------------------------
		// ?           ?    untracked
		// !           !    ignored

		indexStatus := statusCode[0:1]
		workTreeStatus := statusCode[1:2]

		// Untracked
		if statusCode == "??" {
			untracked = append(untracked, filePath)
			continue
		}

		// Staged (index has changes)
		if indexStatus != " " && indexStatus != "?" {
			staged = append(staged, filePath)
		}

		// Unstaged (working tree has changes)
		if workTreeStatus != " " && workTreeStatus != "?" {
			unstaged = append(unstaged, filePath)
		}
	}

	return
}
