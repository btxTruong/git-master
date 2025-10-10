# Task: Implement Input Validator

**Type**: feat
**Status**: todo
**Estimated Effort**: 3 hours
**Dependencies**: 2024-10-11-1400-feat-create-models-package.md

## Description

Create input validation utilities to prevent command injection attacks and ensure all user-provided inputs (branch names, commit hashes, file paths, commit messages) are validated before being passed to Git commands.

## Acceptance Criteria

- [ ] File `backend/git/validator.go` created
- [ ] Branch name validation implemented
- [ ] Commit hash validation implemented
- [ ] File path validation implemented
- [ ] Commit message sanitization implemented
- [ ] Remote name validation implemented
- [ ] Tag name validation implemented
- [ ] All validators have comprehensive tests
- [ ] Documentation includes validation rules

## Technical Details

### validator.go Implementation

```go
package git

import (
    "errors"
    "path/filepath"
    "regexp"
    "strings"
)

var (
    // Git ref name validation (simplified)
    // https://git-scm.com/docs/git-check-ref-format
    refNameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._/-]*$`)

    // Commit hash validation (7-40 hex characters)
    commitHashRegex = regexp.MustCompile(`^[a-f0-9]{7,40}$`)

    // Remote name validation
    remoteNameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._-]*$`)
)

// ValidateBranchName validates a Git branch name
func ValidateBranchName(name string) error {
    if name == "" {
        return errors.New("branch name cannot be empty")
    }

    if len(name) > 255 {
        return errors.New("branch name too long (max 255 characters)")
    }

    // Check for invalid patterns
    if strings.HasPrefix(name, "-") {
        return errors.New("branch name cannot start with '-'")
    }

    if strings.HasSuffix(name, ".") {
        return errors.New("branch name cannot end with '.'")
    }

    if strings.HasSuffix(name, ".lock") {
        return errors.New("branch name cannot end with '.lock'")
    }

    if strings.Contains(name, "..") {
        return errors.New("branch name cannot contain '..'")
    }

    if strings.Contains(name, "//") {
        return errors.New("branch name cannot contain '//'")
    }

    if strings.Contains(name, "@{") {
        return errors.New("branch name cannot contain '@{'")
    }

    if strings.ContainsAny(name, "~^:?*[\\") {
        return errors.New("branch name contains invalid characters (~^:?*[\\)")
    }

    if strings.Contains(name, " ") {
        return errors.New("branch name cannot contain spaces")
    }

    if !refNameRegex.MatchString(name) {
        return errors.New("branch name contains invalid characters")
    }

    return nil
}

// ValidateCommitHash validates a commit hash (short or full)
func ValidateCommitHash(hash string) error {
    if hash == "" {
        return errors.New("commit hash cannot be empty")
    }

    if !commitHashRegex.MatchString(hash) {
        return errors.New("invalid commit hash format (must be 7-40 hex characters)")
    }

    return nil
}

// ValidateFilePath ensures file path is within repository
func ValidateFilePath(repoPath, filePath string) error {
    if filePath == "" {
        return errors.New("file path cannot be empty")
    }

    // Convert to absolute path
    absFilePath, err := filepath.Abs(filepath.Join(repoPath, filePath))
    if err != nil {
        return err
    }

    absRepoPath, err := filepath.Abs(repoPath)
    if err != nil {
        return err
    }

    // Ensure file is within repository
    if !strings.HasPrefix(absFilePath, absRepoPath) {
        return errors.New("file path is outside repository")
    }

    // Check for directory traversal attempts
    if strings.Contains(filePath, "..") {
        return errors.New("file path cannot contain '..'")
    }

    return nil
}

// SanitizeCommitMessage removes dangerous characters from commit message
func SanitizeCommitMessage(message string) string {
    // Remove null bytes
    message = strings.ReplaceAll(message, "\x00", "")

    // Remove other control characters except newline, tab
    var sanitized strings.Builder
    for _, r := range message {
        if r == '\n' || r == '\t' || r >= 32 {
            sanitized.WriteRune(r)
        }
    }

    message = sanitized.String()

    // Limit size
    const maxSize = 100 * 1024 // 100KB
    if len(message) > maxSize {
        message = message[:maxSize]
    }

    // Trim whitespace
    message = strings.TrimSpace(message)

    return message
}

// ValidateRemoteName validates a Git remote name
func ValidateRemoteName(name string) error {
    if name == "" {
        return errors.New("remote name cannot be empty")
    }

    if len(name) > 255 {
        return errors.New("remote name too long (max 255 characters)")
    }

    if !remoteNameRegex.MatchString(name) {
        return errors.New("remote name contains invalid characters")
    }

    return nil
}

// ValidateTagName validates a Git tag name (same rules as branch)
func ValidateTagName(name string) error {
    // Tags follow same validation rules as branches
    return ValidateBranchName(name)
}

// ValidateRemoteURL validates a Git remote URL
func ValidateRemoteURL(url string) error {
    if url == "" {
        return errors.New("remote URL cannot be empty")
    }

    // Basic validation - starts with expected protocol
    if !strings.HasPrefix(url, "http://") &&
       !strings.HasPrefix(url, "https://") &&
       !strings.HasPrefix(url, "git://") &&
       !strings.HasPrefix(url, "ssh://") &&
       !strings.HasPrefix(url, "git@") &&
       !strings.HasPrefix(url, "file://") &&
       !strings.HasPrefix(url, "/") &&
       !strings.HasPrefix(url, ".") {
        return errors.New("remote URL has invalid format")
    }

    return nil
}

// NormalizePath normalizes a file path for Git commands
func NormalizePath(path string) string {
    // Convert to forward slashes (Git expects this even on Windows)
    path = filepath.ToSlash(path)

    // Remove duplicate slashes
    path = strings.ReplaceAll(path, "//", "/")

    return path
}

// IsPathSafe checks if path is safe to use (no command injection)
func IsPathSafe(path string) bool {
    // Check for shell metacharacters
    dangerous := []string{
        ";", "&", "|", "$", "`", "$(", "${",
        ">", "<", ">>", "<<",
        "&&", "||",
    }

    for _, char := range dangerous {
        if strings.Contains(path, char) {
            return false
        }
    }

    return true
}
```

## Implementation Notes

- Branch name validation follows Git's ref name rules
- Commit hash accepts both short (7+ chars) and full (40 chars) hashes
- File path validation prevents directory traversal attacks
- Commit message sanitization removes control characters
- All validators return descriptive error messages
- Path normalization handles cross-platform differences

## Testing

**Test file**: `backend/git/validator_test.go`

```go
package git

import (
    "testing"
)

func TestValidateBranchName_Valid(t *testing.T) {
    valid := []string{
        "main",
        "feature/new-feature",
        "bugfix/issue-123",
        "release/v1.0.0",
        "user/john/work",
        "v1.0",
    }

    for _, name := range valid {
        if err := ValidateBranchName(name); err != nil {
            t.Errorf("Expected '%s' to be valid, got error: %v", name, err)
        }
    }
}

func TestValidateBranchName_Invalid(t *testing.T) {
    invalid := []string{
        "",                    // Empty
        "-main",               // Starts with dash
        "feature.",            // Ends with dot
        "bug..fix",            // Contains ..
        "feature//bug",        // Contains //
        "ref@{",               // Contains @{
        "with space",          // Contains space
        "with~tilde",          // Contains ~
        "with^caret",          // Contains ^
        "with:colon",          // Contains :
        "with?question",       // Contains ?
        "with*asterisk",       // Contains *
        "with[bracket",        // Contains [
        "with\\backslash",     // Contains \
    }

    for _, name := range invalid {
        if err := ValidateBranchName(name); err == nil {
            t.Errorf("Expected '%s' to be invalid", name)
        }
    }
}

func TestValidateCommitHash_Valid(t *testing.T) {
    valid := []string{
        "abc1234",                                   // Short hash
        "abc123def456",                              // Medium hash
        "abc123def456789abc123def456789abc123def45", // Full hash
    }

    for _, hash := range valid {
        if err := ValidateCommitHash(hash); err != nil {
            t.Errorf("Expected '%s' to be valid, got error: %v", hash, err)
        }
    }
}

func TestValidateCommitHash_Invalid(t *testing.T) {
    invalid := []string{
        "",          // Empty
        "abc",       // Too short
        "ABCDEF1",   // Uppercase
        "xyz1234",   // Non-hex characters
        "abc 123",   // Space
        "abc123g",   // Invalid hex character
    }

    for _, hash := range invalid {
        if err := ValidateCommitHash(hash); err == nil {
            t.Errorf("Expected '%s' to be invalid", hash)
        }
    }
}

func TestValidateFilePath_Valid(t *testing.T) {
    repoPath := "/tmp/repo"
    valid := []string{
        "file.txt",
        "dir/file.txt",
        "dir/subdir/file.txt",
    }

    for _, path := range valid {
        if err := ValidateFilePath(repoPath, path); err != nil {
            t.Errorf("Expected '%s' to be valid, got error: %v", path, err)
        }
    }
}

func TestValidateFilePath_Invalid(t *testing.T) {
    repoPath := "/tmp/repo"
    invalid := []string{
        "",              // Empty
        "../outside",    // Directory traversal
        "../../etc",     // Directory traversal
    }

    for _, path := range invalid {
        if err := ValidateFilePath(repoPath, path); err == nil {
            t.Errorf("Expected '%s' to be invalid", path)
        }
    }
}

func TestSanitizeCommitMessage(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        {"Normal message", "Normal message"},
        {"Message\x00with\x00nulls", "Messagewith nulls"},
        {"Message\nwith\nnewlines", "Message\nwith\nnewlines"},
        {"  Trimmed  ", "Trimmed"},
        {"", ""},
    }

    for _, test := range tests {
        result := SanitizeCommitMessage(test.input)
        if result != test.expected {
            t.Errorf("Expected '%s', got '%s'", test.expected, result)
        }
    }
}

func TestIsPathSafe(t *testing.T) {
    safe := []string{
        "file.txt",
        "dir/file.txt",
        "my-file.txt",
    }

    for _, path := range safe {
        if !IsPathSafe(path) {
            t.Errorf("Expected '%s' to be safe", path)
        }
    }

    unsafe := []string{
        "file.txt; rm -rf /",
        "file && malicious",
        "file | grep password",
        "$(whoami)",
        "`whoami`",
    }

    for _, path := range unsafe {
        if IsPathSafe(path) {
            t.Errorf("Expected '%s' to be unsafe", path)
        }
    }
}
```
