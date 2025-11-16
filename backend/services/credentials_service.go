package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/zalando/go-keyring"
)

const (
	serviceName    = "git-master"
	tokenKey       = "github-token"       // Legacy single token
	tokenListKey   = "github-tokens-list" // List of token IDs
	tokenKeyPrefix = "github-token-"      // Prefix for individual tokens
)

// GitHubToken represents a GitHub personal access token with metadata
type GitHubToken struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	RepoPattern string `json:"repoPattern"` // e.g., "github.com/user/repo" or "github.com/user/*"
	Token       string `json:"-"`           // Not stored in JSON, stored separately in keyring
}

// CredentialsService handles secure storage of credentials
type CredentialsService struct {
	ctx              context.Context
	appConfigService *AppConfigService
}

// NewCredentialsService creates a new credentials service
func NewCredentialsService() *CredentialsService {
	return &CredentialsService{}
}

// SetAppConfigService sets the app config service (for clearing token selections when deleting tokens)
func (s *CredentialsService) SetAppConfigService(appConfigService *AppConfigService) {
	s.appConfigService = appConfigService
}

// Startup is called when the app starts
func (s *CredentialsService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetGitHubToken stores the GitHub personal access token securely in the system keyring
func (s *CredentialsService) SetGitHubToken(token string) error {
	if token == "" {
		return fmt.Errorf("token cannot be empty")
	}

	err := keyring.Set(serviceName, tokenKey, token)
	if err != nil {
		return fmt.Errorf("failed to store token: %w", err)
	}

	return nil
}

// GetGitHubToken retrieves the stored GitHub personal access token from the system keyring
func (s *CredentialsService) GetGitHubToken() (string, error) {
	token, err := keyring.Get(serviceName, tokenKey)
	if err == keyring.ErrNotFound {
		return "", nil // No token stored, return empty string
	}
	if err != nil {
		return "", fmt.Errorf("failed to retrieve token: %w", err)
	}

	return token, nil
}

// DeleteGitHubToken removes the stored GitHub token from the system keyring
func (s *CredentialsService) DeleteGitHubToken() error {
	err := keyring.Delete(serviceName, tokenKey)
	if err == keyring.ErrNotFound {
		return nil // Token doesn't exist, which is fine
	}
	if err != nil {
		return fmt.Errorf("failed to delete token: %w", err)
	}

	return nil
}

// HasGitHubToken checks if a GitHub token is stored
func (s *CredentialsService) HasGitHubToken() (bool, error) {
	token, err := s.GetGitHubToken()
	if err != nil {
		return false, err
	}
	return token != "", nil
}

// ============= Multiple Token Management =============

// getTokenList retrieves the list of token metadata from keyring
func (s *CredentialsService) getTokenList() ([]GitHubToken, error) {
	listJSON, err := keyring.Get(serviceName, tokenListKey)
	if err == keyring.ErrNotFound {
		return []GitHubToken{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve token list: %w", err)
	}

	var tokens []GitHubToken
	if err := json.Unmarshal([]byte(listJSON), &tokens); err != nil {
		return nil, fmt.Errorf("failed to parse token list: %w", err)
	}

	return tokens, nil
}

// saveTokenList saves the list of token metadata to keyring
func (s *CredentialsService) saveTokenList(tokens []GitHubToken) error {
	listJSON, err := json.Marshal(tokens)
	if err != nil {
		return fmt.Errorf("failed to marshal token list: %w", err)
	}

	if err := keyring.Set(serviceName, tokenListKey, string(listJSON)); err != nil {
		return fmt.Errorf("failed to save token list: %w", err)
	}

	return nil
}

// AddGitHubTokenWithRepo adds a new GitHub token with repository association
func (s *CredentialsService) AddGitHubTokenWithRepo(id, name, repoPattern, token string) error {
	if id == "" || name == "" || token == "" {
		return fmt.Errorf("id, name, and token cannot be empty")
	}

	// Get existing tokens
	tokens, err := s.getTokenList()
	if err != nil {
		return err
	}

	// Check if ID already exists
	for _, t := range tokens {
		if t.ID == id {
			return fmt.Errorf("token with ID %s already exists", id)
		}
	}

	// Store the actual token in keyring
	tokenKeyName := tokenKeyPrefix + id
	if err := keyring.Set(serviceName, tokenKeyName, token); err != nil {
		return fmt.Errorf("failed to store token: %w", err)
	}

	// Add to token list
	tokens = append(tokens, GitHubToken{
		ID:          id,
		Name:        name,
		RepoPattern: repoPattern,
	})

	return s.saveTokenList(tokens)
}

// UpdateGitHubTokenWithRepo updates an existing GitHub token
func (s *CredentialsService) UpdateGitHubTokenWithRepo(id, name, repoPattern, token string) error {
	if id == "" {
		return fmt.Errorf("id cannot be empty")
	}

	// Get existing tokens
	tokens, err := s.getTokenList()
	if err != nil {
		return err
	}

	// Find and update the token
	found := false
	for i, t := range tokens {
		if t.ID == id {
			found = true
			tokens[i].Name = name
			tokens[i].RepoPattern = repoPattern
			break
		}
	}

	if !found {
		return fmt.Errorf("token with ID %s not found", id)
	}

	// Update the actual token if provided
	if token != "" {
		tokenKeyName := tokenKeyPrefix + id
		if err := keyring.Set(serviceName, tokenKeyName, token); err != nil {
			return fmt.Errorf("failed to update token: %w", err)
		}
	}

	return s.saveTokenList(tokens)
}

// DeleteGitHubTokenWithRepo deletes a GitHub token by ID
func (s *CredentialsService) DeleteGitHubTokenWithRepo(id string) error {
	if id == "" {
		return fmt.Errorf("id cannot be empty")
	}

	// Get existing tokens
	tokens, err := s.getTokenList()
	if err != nil {
		return err
	}

	// Remove the token from the list
	newTokens := []GitHubToken{}
	found := false
	for _, t := range tokens {
		if t.ID != id {
			newTokens = append(newTokens, t)
		} else {
			found = true
		}
	}

	if !found {
		return fmt.Errorf("token with ID %s not found", id)
	}

	// Delete the actual token from keyring
	tokenKeyName := tokenKeyPrefix + id
	if err := keyring.Delete(serviceName, tokenKeyName); err != nil && err != keyring.ErrNotFound {
		return fmt.Errorf("failed to delete token: %w", err)
	}

	// Clear this token from all repository selections
	if s.appConfigService != nil {
		if err := s.appConfigService.ClearTokenFromAllRepos(id); err != nil {
			// Log the error but don't fail the deletion
			fmt.Printf("Warning: failed to clear token selections: %v\n", err)
		}
	}

	return s.saveTokenList(newTokens)
}

// GetAllGitHubTokens returns all stored GitHub tokens (without the actual token values)
func (s *CredentialsService) GetAllGitHubTokens() ([]GitHubToken, error) {
	return s.getTokenList()
}

// GetGitHubTokenByID retrieves a specific token by ID (includes the actual token value)
func (s *CredentialsService) GetGitHubTokenByID(id string) (*GitHubToken, error) {
	tokens, err := s.getTokenList()
	if err != nil {
		return nil, err
	}

	for _, t := range tokens {
		if t.ID == id {
			// Get the actual token value
			tokenKeyName := tokenKeyPrefix + id
			token, err := keyring.Get(serviceName, tokenKeyName)
			if err != nil {
				return nil, fmt.Errorf("failed to retrieve token value: %w", err)
			}
			t.Token = token
			return &t, nil
		}
	}

	return nil, fmt.Errorf("token with ID %s not found", id)
}

// GetGitHubTokenForRepo finds the best matching token for a given repository URL
// If selectedTokenID is provided, it will try to use that token first
func (s *CredentialsService) GetGitHubTokenForRepo(repoURL string) (string, error) {
	return s.GetGitHubTokenForRepoWithSelection(repoURL, "")
}

// GetGitHubTokenForRepoWithSelection finds the best matching token for a given repository URL
// If selectedTokenID is provided, it will try to use that token first
func (s *CredentialsService) GetGitHubTokenForRepoWithSelection(repoURL, selectedTokenID string) (string, error) {
	tokens, err := s.getTokenList()
	if err != nil {
		return "", err
	}

	// If a specific token is selected, use it
	if selectedTokenID != "" {
		for i := range tokens {
			if tokens[i].ID == selectedTokenID {
				tokenKeyName := tokenKeyPrefix + selectedTokenID
				token, err := keyring.Get(serviceName, tokenKeyName)
				if err != nil {
					return "", fmt.Errorf("failed to retrieve selected token: %w", err)
				}
				return token, nil
			}
		}
		// Selected token not found, fall through to pattern matching
	}

	// Normalize repo URL (extract domain/user/repo)
	repoURL = strings.TrimPrefix(repoURL, "https://")
	repoURL = strings.TrimPrefix(repoURL, "http://")
	repoURL = strings.TrimSuffix(repoURL, ".git")

	// Find the best match
	var bestMatch *GitHubToken
	bestMatchScore := 0

	for i := range tokens {
		pattern := tokens[i].RepoPattern
		if pattern == "" {
			continue
		}

		// Check if pattern matches
		if matchesPattern(repoURL, pattern) {
			// Calculate match score (more specific patterns get higher scores)
			score := len(pattern)
			if score > bestMatchScore {
				bestMatchScore = score
				bestMatch = &tokens[i]
			}
		}
	}

	if bestMatch == nil {
		// Fall back to legacy single token
		return s.GetGitHubToken()
	}

	// Get the actual token value
	tokenKeyName := tokenKeyPrefix + bestMatch.ID
	token, err := keyring.Get(serviceName, tokenKeyName)
	if err != nil {
		return "", fmt.Errorf("failed to retrieve token value: %w", err)
	}

	return token, nil
}

// matchesPattern checks if a repo URL matches a pattern
// Supports wildcards: github.com/user/* matches github.com/user/repo1, github.com/user/repo2, etc.
func matchesPattern(repoURL, pattern string) bool {
	if pattern == "*" {
		return true
	}

	// Exact match
	if repoURL == pattern {
		return true
	}

	// Wildcard match
	if strings.HasSuffix(pattern, "/*") {
		prefix := strings.TrimSuffix(pattern, "/*")
		return strings.HasPrefix(repoURL, prefix+"/")
	}

	return false
}
