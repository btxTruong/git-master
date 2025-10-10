package models

// Branch represents a Git branch
type Branch struct {
	Name       string `json:"name"`
	IsHead     bool   `json:"isHead"`     // is the current branch
	IsRemote   bool   `json:"isRemote"`   // is a remote branch
	Remote     string `json:"remote"`     // remote name (e.g., "origin")
	CommitHash string `json:"commitHash"` // hash of the branch tip
	Upstream   string `json:"upstream"`   // upstream branch if tracking
}

// BranchList contains local and remote branches
type BranchList struct {
	Current string   `json:"current"`
	Local   []Branch `json:"local"`
	Remote  []Branch `json:"remote"`
}
