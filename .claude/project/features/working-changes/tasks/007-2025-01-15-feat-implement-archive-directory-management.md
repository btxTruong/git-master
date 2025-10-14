# Task: Implement Archive Directory Management

## Description
Implement utility functions for managing archive storage directories. This includes determining archive paths, sanitizing archive names, creating necessary directories, and listing existing archives.

Functionality:
- Get archive directory path for repository
- Sanitize user-provided archive names for filesystem safety
- Create archive directories if they don't exist
- List all archives for a repository
- Parse archive metadata files

## Acceptance Criteria
- [ ] GetArchiveDirectoryPath returns `~/.git-master/{repo-name}/`
- [ ] SanitizeArchiveName removes dangerous characters but preserves readability
- [ ] EnsureArchiveDirectoryExists creates directory structure with proper permissions
- [ ] ListAllArchivesForRepository returns all archives with metadata
- [ ] Archive names deduplicated (append number if exists)
- [ ] Cross-platform path handling (Windows, macOS, Linux)
- [ ] Metadata JSON files parsed and validated
- [ ] Missing metadata handled gracefully

## Technical Considerations
- Use full descriptive function names
- Extract regex patterns for sanitization as constants
- Repository name: base name of repository path
- Archive path: `~/.git-master/{repo-name}/{archive-name}.diff`
- Metadata path: `~/.git-master/{repo-name}/{archive-name}.meta.json`
- Sanitize by removing: `/ \ : * ? " < > |`
- Replace whitespace with hyphens
- Directory permissions: 0755
- File permissions: 0644

## Dependencies
- Depends on: 001 Create changelist models and types

## Estimated Effort
3 hours
