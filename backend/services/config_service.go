package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// RepositoryConfig stores configuration for a specific repository
type RepositoryConfig struct {
	RepositoryPath string `json:"repositoryPath"`
	SelectedToken  string `json:"selectedToken"` // Token ID to use for this repo
}

// ConfigService manages application configuration
type ConfigService struct {
	ctx        context.Context
	configDir  string
	configFile string
	configs    map[string]*RepositoryConfig // Key: repository path
}

// NewConfigService creates a new config service
func NewConfigService() *ConfigService {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}

	configDir := filepath.Join(homeDir, ".git-master")
	configFile := filepath.Join(configDir, "config.json")

	return &ConfigService{
		configDir:  configDir,
		configFile: configFile,
		configs:    make(map[string]*RepositoryConfig),
	}
}

// Startup is called when the app starts
func (s *ConfigService) Startup(ctx context.Context) {
	s.ctx = ctx

	// Ensure config directory exists
	if err := os.MkdirAll(s.configDir, 0755); err != nil {
		fmt.Printf("Warning: failed to create config directory: %v\n", err)
		return
	}

	// Load existing config
	if err := s.loadConfig(); err != nil {
		fmt.Printf("Warning: failed to load config: %v\n", err)
	}
}

// loadConfig loads the configuration from disk
func (s *ConfigService) loadConfig() error {
	data, err := os.ReadFile(s.configFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // Config file doesn't exist yet, that's fine
		}
		return err
	}

	return json.Unmarshal(data, &s.configs)
}

// saveConfig saves the configuration to disk
func (s *ConfigService) saveConfig() error {
	data, err := json.MarshalIndent(s.configs, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.configFile, data, 0644)
}

// SetSelectedToken sets the selected token ID for a repository
func (s *ConfigService) SetSelectedToken(repoPath, tokenID string) error {
	if repoPath == "" {
		return fmt.Errorf("repository path cannot be empty")
	}

	// Normalize path
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Get or create config for this repository
	config, exists := s.configs[absPath]
	if !exists {
		config = &RepositoryConfig{
			RepositoryPath: absPath,
		}
		s.configs[absPath] = config
	}

	config.SelectedToken = tokenID

	return s.saveConfig()
}

// GetSelectedToken gets the selected token ID for a repository
func (s *ConfigService) GetSelectedToken(repoPath string) (string, error) {
	if repoPath == "" {
		return "", fmt.Errorf("repository path cannot be empty")
	}

	// Normalize path
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to get absolute path: %w", err)
	}

	config, exists := s.configs[absPath]
	if !exists || config.SelectedToken == "" {
		return "", nil // No token selected
	}

	return config.SelectedToken, nil
}

// ClearSelectedToken clears the selected token for a repository
func (s *ConfigService) ClearSelectedToken(repoPath string) error {
	if repoPath == "" {
		return fmt.Errorf("repository path cannot be empty")
	}

	// Normalize path
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	config, exists := s.configs[absPath]
	if !exists {
		return nil // Nothing to clear
	}

	config.SelectedToken = ""
	return s.saveConfig()
}

// GetRepositoryConfig gets the full configuration for a repository
func (s *ConfigService) GetRepositoryConfig(repoPath string) (*RepositoryConfig, error) {
	if repoPath == "" {
		return nil, fmt.Errorf("repository path cannot be empty")
	}

	// Normalize path
	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	config, exists := s.configs[absPath]
	if !exists {
		return &RepositoryConfig{
			RepositoryPath: absPath,
			SelectedToken:  "",
		}, nil
	}

	return config, nil
}

// ClearTokenFromAllRepos clears a specific token ID from all repository configurations
func (s *ConfigService) ClearTokenFromAllRepos(tokenID string) error {
	if tokenID == "" {
		return nil
	}

	modified := false
	for _, config := range s.configs {
		if config.SelectedToken == tokenID {
			config.SelectedToken = ""
			modified = true
		}
	}

	if modified {
		return s.saveConfig()
	}

	return nil
}
