package models

import "time"

// Repository represents a Git repository
type Repository struct {
	Path          string    `json:"path"`
	Name          string    `json:"name"`
	CurrentBranch string    `json:"currentBranch"`
	IsDetached    bool      `json:"isDetached"`
	LastOpened    time.Time `json:"lastOpened"`
}

// RepositoryStatus represents the current status of a repository
type RepositoryStatus struct {
	Branch          string   `json:"branch"`
	Ahead           int      `json:"ahead"`
	Behind          int      `json:"behind"`
	StagedFiles     []string `json:"stagedFiles"`
	UnstagedFiles   []string `json:"unstagedFiles"`
	UntrackedFiles  []string `json:"untrackedFiles"`
	HasConflicts    bool     `json:"hasConflicts"`
	ConflictedFiles []string `json:"conflictedFiles"`
}
