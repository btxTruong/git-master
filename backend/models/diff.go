package models

// DiffResult represents the diff output
type DiffResult struct {
	Files []FileDiff `json:"files"`
}

// FileDiff represents changes to a single file
type FileDiff struct {
	OldPath    string     `json:"oldPath"`
	NewPath    string     `json:"newPath"`
	Status     ChangeType `json:"status"` // A, M, D, R, C
	Hunks      []DiffHunk `json:"hunks"`
	IsBinary   bool       `json:"isBinary"`
	Insertions int        `json:"insertions"`
	Deletions  int        `json:"deletions"`
	Similarity int        `json:"similarity"` // for renames/copies (0-100)
}

// DiffHunk represents a continuous block of changes
type DiffHunk struct {
	OldStart int        `json:"oldStart"`
	OldLines int        `json:"oldLines"`
	NewStart int        `json:"newStart"`
	NewLines int        `json:"newLines"`
	Header   string     `json:"header"` // e.g., "@@ -1,4 +1,5 @@ function foo()"
	Lines    []DiffLine `json:"lines"`
}

// DiffLine represents a single line in a diff
type DiffLine struct {
	Type    LineType `json:"type"`    // context, add, delete
	Content string   `json:"content"` // line content without +/- prefix
	OldNum  int      `json:"oldNum"`  // line number in old file (0 if added)
	NewNum  int      `json:"newNum"`  // line number in new file (0 if deleted)
}

// LineType represents the type of diff line
type LineType string

const (
	LineContext LineType = "context"
	LineAdd     LineType = "add"
	LineDelete  LineType = "delete"
)

// ChangeType represents the type of file change
type ChangeType string

const (
	ChangeAdded    ChangeType = "A" // Added
	ChangeModified ChangeType = "M" // Modified
	ChangeDeleted  ChangeType = "D" // Deleted
	ChangeRenamed  ChangeType = "R" // Renamed
	ChangeCopied   ChangeType = "C" // Copied
)

// FileChange represents a file that changed in a commit
type FileChange struct {
	OldPath    string     `json:"oldPath"`
	NewPath    string     `json:"newPath"`
	Status     ChangeType `json:"status"`
	Insertions int        `json:"insertions"`
	Deletions  int        `json:"deletions"`
}
