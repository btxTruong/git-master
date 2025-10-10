# Task: Implement Commit Log Parser

**Type**: feat
**Status**: todo
**Estimated Effort**: 3 hours
**Dependencies**: 2024-10-11-1400-feat-create-models-package.md

## Description

Create the commit log parser that converts Git log output into structured `Commit` objects. This parser must handle the custom format with NULL delimiters and numstat output for file statistics.

## Acceptance Criteria

- [x] File `backend/git/log_parser.go` created
- [x] ParseCommitLog function implemented
- [x] Handles NULL-delimited format correctly
- [x] Parses all commit fields (hash, author, dates, message, parents)
- [x] Parses numstat lines for file statistics
- [x] Handles edge cases (initial commit, merge commits, empty body)
- [x] Comprehensive tests with real Git output
- [x] Documentation includes expected format

## Technical Details

### Expected Git Log Format

**Command**:
```bash
git log \
    --pretty=format:'%H%x00%h%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%ct%x00%s%x00%b%x00%P%x00' \
    --numstat
```

**Output Format**:
```
<full_hash><NULL><abbrev><NULL><author_name><NULL><author_email><NULL><committer_name><NULL><committer_email><NULL><author_timestamp><NULL><commit_timestamp><NULL><subject><NULL><body><NULL><parents><NULL>

<insertions><TAB><deletions><TAB><file_path>
<insertions><TAB><deletions><TAB><file_path>

<next commit...>
```

### Parser Implementation

```go
package git

import (
    "strconv"
    "strings"
    "time"
    "git-master/backend/models"
)

// ParseCommitLog parses git log output into Commit structs
func ParseCommitLog(output string) ([]models.Commit, error) {
    if strings.TrimSpace(output) == "" {
        return []models.Commit{}, nil
    }

    commits := []models.Commit{}

    // Split by double newline (commit separator)
    commitBlocks := strings.Split(output, "\n\n")

    for _, block := range commitBlocks {
        if strings.TrimSpace(block) == "" {
            continue
        }

        commit, err := parseCommitBlock(block)
        if err != nil {
            // Log error but continue parsing other commits
            continue
        }

        commits = append(commits, commit)
    }

    return commits, nil
}

func parseCommitBlock(block string) (models.Commit, error) {
    lines := strings.Split(block, "\n")
    if len(lines) < 1 {
        return models.Commit{}, fmt.Errorf("empty commit block")
    }

    // Parse header line (NULL-delimited)
    parts := strings.Split(lines[0], "\x00")
    if len(parts) < 11 {
        return models.Commit{}, fmt.Errorf("invalid commit format: expected 11 parts, got %d", len(parts))
    }

    // Parse timestamps
    authorTime, err := strconv.ParseInt(parts[6], 10, 64)
    if err != nil {
        authorTime = 0
    }

    commitTime, err := strconv.ParseInt(parts[7], 10, 64)
    if err != nil {
        commitTime = 0
    }

    // Parse parents (space-separated)
    var parents []string
    if parts[10] != "" {
        parents = strings.Fields(parts[10])
    } else {
        parents = []string{}
    }

    commit := models.Commit{
        Hash:       parts[0],
        AbbrevHash: parts[1],
        Author: models.Person{
            Name:  parts[2],
            Email: parts[3],
        },
        Committer: models.Person{
            Name:  parts[4],
            Email: parts[5],
        },
        AuthorDate:   time.Unix(authorTime, 0),
        CommitDate:   time.Unix(commitTime, 0),
        Subject:      parts[8],
        Body:         strings.TrimSpace(parts[9]),
        Parents:      parents,
        FilesChanged: 0,
        Insertions:   0,
        Deletions:    0,
    }

    // Parse numstat lines (remaining lines)
    for i := 1; i < len(lines); i++ {
        line := strings.TrimSpace(lines[i])
        if line == "" {
            continue
        }

        insertions, deletions, parsed := parseNumstatLine(line)
        if parsed {
            commit.FilesChanged++
            commit.Insertions += insertions
            commit.Deletions += deletions
        }
    }

    return commit, nil
}

func parseNumstatLine(line string) (insertions, deletions int, ok bool) {
    // Format: <insertions><TAB><deletions><TAB><file_path>
    parts := strings.Split(line, "\t")
    if len(parts) < 3 {
        return 0, 0, false
    }

    // Handle binary files (shown as -)
    if parts[0] == "-" {
        return 0, 0, true // Binary file, count as 1 file changed
    }

    ins, err := strconv.Atoi(parts[0])
    if err != nil {
        return 0, 0, false
    }

    del, err := strconv.Atoi(parts[1])
    if err != nil {
        return 0, 0, false
    }

    return ins, del, true
}

// ParseCommitDetails parses detailed commit information including changed files
func ParseCommitDetails(output string) (*models.Commit, error) {
    // Similar to ParseCommitLog but includes file-level details
    commits, err := ParseCommitLog(output)
    if err != nil {
        return nil, err
    }

    if len(commits) == 0 {
        return nil, fmt.Errorf("no commit found in output")
    }

    return &commits[0], nil
}

// ParseCommitWithFiles parses commit with detailed file changes
func ParseCommitWithFiles(logOutput, statOutput string) (*models.Commit, error) {
    // Parse basic commit info
    commit, err := ParseCommitDetails(logOutput)
    if err != nil {
        return nil, err
    }

    // Parse detailed file stats
    commit.ChangedFiles = parseFileChanges(statOutput)

    return commit, nil
}

func parseFileChanges(output string) []models.FileChange {
    changes := []models.FileChange{}

    lines := strings.Split(output, "\n")
    for _, line := range lines {
        line = strings.TrimSpace(line)
        if line == "" {
            continue
        }

        parts := strings.Split(line, "\t")
        if len(parts) < 3 {
            continue
        }

        insertions, _ := strconv.Atoi(parts[0])
        deletions, _ := strconv.Atoi(parts[1])
        path := parts[2]

        // Detect status from path
        status := "M" // Default to modified
        isBinary := parts[0] == "-"

        // Handle renames: oldpath => newpath
        oldPath := ""
        if strings.Contains(path, " => ") {
            pathParts := strings.Split(path, " => ")
            oldPath = pathParts[0]
            path = pathParts[1]
            status = "R"
        }

        changes = append(changes, models.FileChange{
            Path:       path,
            OldPath:    oldPath,
            Status:     status,
            Insertions: insertions,
            Deletions:  deletions,
            IsBinary:   isBinary,
        })
    }

    return changes
}
```

## Implementation Notes

- Use NULL (`\x00`) as delimiter to avoid ambiguity with spaces in names/messages
- Handle Unix timestamps (seconds since epoch)
- Empty body should be empty string, not null
- Empty parents array means initial commit (no parent)
- Multiple parents means merge commit
- Binary files show as `-` in numstat
- Trim whitespace but preserve internal formatting

## Testing

**Test file**: `backend/git/log_parser_test.go`

```go
package git

import (
    "testing"
    "time"
)

func TestParseCommitLog_SingleCommit(t *testing.T) {
    input := "abc1234567890\x00abc1234\x00John Doe\x00john@example.com\x00John Doe\x00john@example.com\x001234567890\x001234567890\x00Initial commit\x00This is the body\x00\x00\n\n1\t0\tREADME.md\n"

    commits, err := ParseCommitLog(input)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 1 {
        t.Fatalf("Expected 1 commit, got %d", len(commits))
    }

    commit := commits[0]

    if commit.Hash != "abc1234567890" {
        t.Errorf("Expected hash 'abc1234567890', got '%s'", commit.Hash)
    }

    if commit.AbbrevHash != "abc1234" {
        t.Errorf("Expected abbrev 'abc1234', got '%s'", commit.AbbrevHash)
    }

    if commit.Author.Name != "John Doe" {
        t.Errorf("Expected author 'John Doe', got '%s'", commit.Author.Name)
    }

    if commit.Subject != "Initial commit" {
        t.Errorf("Expected subject 'Initial commit', got '%s'", commit.Subject)
    }

    if commit.Body != "This is the body" {
        t.Errorf("Expected body 'This is the body', got '%s'", commit.Body)
    }

    if commit.FilesChanged != 1 {
        t.Errorf("Expected 1 file changed, got %d", commit.FilesChanged)
    }

    if commit.Insertions != 1 {
        t.Errorf("Expected 1 insertion, got %d", commit.Insertions)
    }
}

func TestParseCommitLog_MultipleCommits(t *testing.T) {
    input := "abc1234\x00abc123\x00Author1\x00a1@ex.com\x00Author1\x00a1@ex.com\x001234567890\x001234567890\x00Commit 1\x00\x00\x00\n\n2\t1\tfile1.txt\n\n\ndef5678\x00def567\x00Author2\x00a2@ex.com\x00Author2\x00a2@ex.com\x001234567891\x001234567891\x00Commit 2\x00\x00abc1234\x00\n\n3\t2\tfile2.txt\n"

    commits, err := ParseCommitLog(input)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 2 {
        t.Fatalf("Expected 2 commits, got %d", len(commits))
    }

    // Check first commit
    if commits[0].Hash != "abc1234" {
        t.Errorf("Expected first hash 'abc1234', got '%s'", commits[0].Hash)
    }

    if len(commits[0].Parents) != 0 {
        t.Errorf("Expected initial commit with no parents, got %d", len(commits[0].Parents))
    }

    // Check second commit
    if commits[1].Hash != "def5678" {
        t.Errorf("Expected second hash 'def5678', got '%s'", commits[1].Hash)
    }

    if len(commits[1].Parents) != 1 {
        t.Errorf("Expected 1 parent, got %d", len(commits[1].Parents))
    }

    if commits[1].Parents[0] != "abc1234" {
        t.Errorf("Expected parent 'abc1234', got '%s'", commits[1].Parents[0])
    }
}

func TestParseCommitLog_MergeCommit(t *testing.T) {
    input := "merge123\x00merge12\x00Author\x00a@ex.com\x00Author\x00a@ex.com\x001234567890\x001234567890\x00Merge branch 'feature'\x00\x00parent1 parent2\x00\n\n"

    commits, err := ParseCommitLog(input)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 1 {
        t.Fatalf("Expected 1 commit, got %d", len(commits))
    }

    commit := commits[0]

    if len(commit.Parents) != 2 {
        t.Errorf("Expected 2 parents, got %d", len(commit.Parents))
    }

    if commit.Parents[0] != "parent1" || commit.Parents[1] != "parent2" {
        t.Errorf("Expected parents ['parent1', 'parent2'], got %v", commit.Parents)
    }
}

func TestParseCommitLog_BinaryFile(t *testing.T) {
    input := "abc1234\x00abc123\x00Author\x00a@ex.com\x00Author\x00a@ex.com\x001234567890\x001234567890\x00Add binary\x00\x00\x00\n\n-\t-\timage.png\n"

    commits, err := ParseCommitLog(input)
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 1 {
        t.Fatalf("Expected 1 commit, got %d", len(commits))
    }

    commit := commits[0]

    if commit.FilesChanged != 1 {
        t.Errorf("Expected 1 file changed, got %d", commit.FilesChanged)
    }

    // Binary files show 0 insertions/deletions
    if commit.Insertions != 0 || commit.Deletions != 0 {
        t.Errorf("Expected 0 insertions/deletions for binary, got %d/%d", commit.Insertions, commit.Deletions)
    }
}

func TestParseCommitLog_EmptyOutput(t *testing.T) {
    commits, err := ParseCommitLog("")
    if err != nil {
        t.Fatal(err)
    }

    if len(commits) != 0 {
        t.Errorf("Expected 0 commits for empty output, got %d", len(commits))
    }
}
```
