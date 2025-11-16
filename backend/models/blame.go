package models

// BlameLine represents a single line of blame information
type BlameLine struct {
	LineNumber     int    `json:"lineNumber"`
	Content        string `json:"content"`
	CommitHash     string `json:"commitHash"`
	ShortHash      string `json:"shortHash"`
	Author         string `json:"author"`
	AuthorEmail    string `json:"authorEmail"`
	AuthorTime     string `json:"authorTime"`
	CommitterName  string `json:"committerName"`
	CommitterEmail string `json:"committerEmail"`
	CommitterTime  string `json:"committerTime"`
	Summary        string `json:"summary"`
}

// BlameResult represents the complete blame result for a file
type BlameResult struct {
	FilePath string      `json:"filePath"`
	Lines    []BlameLine `json:"lines"`
}
