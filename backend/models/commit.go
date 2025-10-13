package models

import "time"

// Commit represents a Git commit
type Commit struct {
	Hash         string    `json:"hash"`
	ShortHash    string    `json:"shortHash"`
	Author       Author    `json:"author"`
	Committer    Author    `json:"committer"`
	Message      string    `json:"message"`
	ShortMessage string    `json:"shortMessage"`
	Date         time.Time `json:"date"`
	ParentHashes []string  `json:"parentHashes"`
	Refs         []string  `json:"refs"`         // branch/tag refs
	FilesChanged int       `json:"filesChanged"` // number of files changed
	Insertions   int       `json:"insertions"`
	Deletions    int       `json:"deletions"`
}

// Author represents commit author or committer
type Author struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// CommitDetail extends Commit with detailed information
type CommitDetail struct {
	Commit
	Files []FileChange `json:"files"`
	Diff  string       `json:"diff"` // full diff text
}

// CommitFilters represents filters for commit history
type CommitFilters struct {
	Branch     string `json:"branch"`
	Author     string `json:"author"`
	DateFrom   string `json:"dateFrom"`
	DateTo     string `json:"dateTo"`
	SearchText string `json:"searchText"`
}
