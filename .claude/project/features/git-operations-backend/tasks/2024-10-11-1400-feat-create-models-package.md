# Task: Create Models Package

**Type**: feat
**Status**: todo
**Estimated Effort**: 2 hours
**Dependencies**: None

## Description

Create the `backend/models/` package with all data structures that will be used throughout the backend services. These models define the contract between Go backend and React frontend via Wails bindings.

## Acceptance Criteria

- [x] Directory `backend/models/` created
- [x] All model files created with proper struct definitions
- [x] All structs have JSON tags for serialization
- [x] All timestamp fields use `time.Time` type
- [x] All models are documented with comments
- [x] Models compile without errors

## Technical Details

### Files to Create

1. **commit.go**: Commit, Person, FileChange structs
2. **branch.go**: Branch struct
3. **diff.go**: DiffResult, FileDiff, DiffHunk, DiffLine structs
4. **repository.go**: Repository, Remote structs
5. **status.go**: RepoStatus, StatusEntry structs
6. **conflict.go**: ConflictInfo, ConflictMarker structs
7. **stash.go**: Stash struct
8. **tag.go**: Tag struct
9. **progress.go**: ProgressEvent struct
10. **error.go**: GitError struct with error codes

### Key Structures

**commit.go**:
```go
package models

import "time"

type Commit struct {
    Hash         string       `json:"hash"`
    AbbrevHash   string       `json:"abbrevHash"`
    Author       Person       `json:"author"`
    Committer    Person       `json:"committer"`
    AuthorDate   time.Time    `json:"authorDate"`
    CommitDate   time.Time    `json:"commitDate"`
    Subject      string       `json:"subject"`
    Body         string       `json:"body"`
    Parents      []string     `json:"parents"`
    FilesChanged int          `json:"filesChanged"`
    Insertions   int          `json:"insertions"`
    Deletions    int          `json:"deletions"`
    ChangedFiles []FileChange `json:"changedFiles,omitempty"`
}

type Person struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

type FileChange struct {
    Path       string `json:"path"`
    OldPath    string `json:"oldPath"`
    Status     string `json:"status"`
    Insertions int    `json:"insertions"`
    Deletions  int    `json:"deletions"`
    IsBinary   bool   `json:"isBinary"`
}
```

See PRD.md "Data Models" section for all structure definitions.

## Implementation Notes

- Package name: `models`
- All structs exported (capitalized names)
- Use consistent JSON field naming (camelCase)
- Add `omitempty` tag for optional fields
- Document each struct and significant field
- Keep models pure data structures (no methods except Error() for GitError)

## Testing

- Verify all models can be marshaled to JSON
- Verify all models can be unmarshaled from JSON
- Test that time.Time serializes to ISO 8601 format
- Verify struct tags are correct

**Test file**: `backend/models/models_test.go`

```go
package models

import (
    "encoding/json"
    "testing"
    "time"
)

func TestCommit_JSONMarshaling(t *testing.T) {
    commit := Commit{
        Hash:       "abc123",
        Subject:    "Test commit",
        AuthorDate: time.Now(),
    }

    data, err := json.Marshal(commit)
    if err != nil {
        t.Fatal(err)
    }

    var decoded Commit
    if err := json.Unmarshal(data, &decoded); err != nil {
        t.Fatal(err)
    }

    if decoded.Hash != commit.Hash {
        t.Errorf("Expected %s, got %s", commit.Hash, decoded.Hash)
    }
}
```
