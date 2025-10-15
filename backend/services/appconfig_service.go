package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

const appConfigFilename = "appconfig.json"

// RepositoryConfig stores configuration for a specific repository
type RepositoryConfig struct {
	Path          string    `json:"path"`
	Name          string    `json:"name"`
	SelectedToken string    `json:"selectedToken"`
	LastOpened    time.Time `json:"lastOpened"`
}

// UIPreferences stores user interface preferences
type UIPreferences struct {
	SidebarOpen             bool   `json:"sidebarOpen"`
	CurrentView             string `json:"currentView"`
	DiffViewMode            string `json:"diffViewMode"`
	Theme                   string `json:"theme"`
	VirtualizationThreshold int    `json:"virtualizationThreshold"`
	DateFormat              string `json:"dateFormat"`
	ShowLineNumbers         bool   `json:"showLineNumbers"`
	AutoRefresh             bool   `json:"autoRefresh"`
	CommitLimit             int    `json:"commitLimit"`
}

// AppConfig stores all application configuration
type AppConfig struct {
	Repositories map[string]*RepositoryConfig `json:"repositories"`
	UI           UIPreferences                `json:"ui"`
}

// AppConfigService manages all application configuration in a single file
type AppConfigService struct {
	ctx        context.Context
	configDir  string
	configFile string
	config     *AppConfig
	mutex      sync.RWMutex
}

// NewAppConfigService creates a new app config service
func NewAppConfigService() *AppConfigService {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}

	configDir := filepath.Join(homeDir, ".git-master")
	configFile := filepath.Join(configDir, appConfigFilename)

	return &AppConfigService{
		configDir:  configDir,
		configFile: configFile,
		config: &AppConfig{
			Repositories: make(map[string]*RepositoryConfig),
			UI: UIPreferences{
				SidebarOpen:             true,
				CurrentView:             "history",
				DiffViewMode:            "unified",
				Theme:                   "system",
				VirtualizationThreshold: 100,
				DateFormat:              "relative",
				ShowLineNumbers:         true,
				AutoRefresh:             true,
				CommitLimit:             100,
			},
		},
	}
}

// Startup is called when the app starts
func (s *AppConfigService) Startup(ctx context.Context) {
	s.ctx = ctx

	if err := os.MkdirAll(s.configDir, 0755); err != nil {
		fmt.Printf("Warning: failed to create config directory: %v\n", err)
		return
	}

	if err := s.loadConfig(); err != nil {
		fmt.Printf("Warning: failed to load app config: %v\n", err)
	}
}

// loadConfig loads configuration from disk
func (s *AppConfigService) loadConfig() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := os.ReadFile(s.configFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	return json.Unmarshal(data, s.config)
}

// saveConfig saves configuration to disk atomically
func (s *AppConfigService) saveConfig() error {
	data, err := json.MarshalIndent(s.config, "", "  ")
	if err != nil {
		return err
	}

	tempFile := s.configFile + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		return err
	}

	return os.Rename(tempFile, s.configFile)
}

// GetRecentRepositories returns repositories sorted by last opened time
func (s *AppConfigService) GetRecentRepositories() ([]RepositoryConfig, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	repos := make([]RepositoryConfig, 0, len(s.config.Repositories))
	for _, repo := range s.config.Repositories {
		if !repo.LastOpened.IsZero() {
			repos = append(repos, *repo)
		}
	}

	sort.Slice(repos, func(i, j int) bool {
		return repos[i].LastOpened.After(repos[j].LastOpened)
	})

	return repos, nil
}

// UpdateRepositoryAccess updates or creates repository config with last opened time
func (s *AppConfigService) UpdateRepositoryAccess(path, name string) error {
	if path == "" || name == "" {
		return fmt.Errorf("path and name cannot be empty")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	absPath, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	repo, exists := s.config.Repositories[absPath]
	if !exists {
		repo = &RepositoryConfig{
			Path: absPath,
			Name: name,
		}
		s.config.Repositories[absPath] = repo
	}

	repo.Name = name
	repo.LastOpened = time.Now()

	return s.saveConfig()
}

// GetUIPreferences returns the UI preferences
func (s *AppConfigService) GetUIPreferences() (*UIPreferences, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	uiPrefs := s.config.UI

	return &uiPrefs, nil
}

// SaveUIPreferences saves the UI preferences
func (s *AppConfigService) SaveUIPreferences(prefs *UIPreferences) error {
	if prefs == nil {
		return fmt.Errorf("preferences cannot be nil")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.config.UI = *prefs

	return s.saveConfig()
}

// SetSelectedToken sets the selected token ID for a repository
func (s *AppConfigService) SetSelectedToken(repoPath, tokenID string) error {
	if repoPath == "" {
		return fmt.Errorf("repository path cannot be empty")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	repo, exists := s.config.Repositories[absPath]
	if !exists {
		repo = &RepositoryConfig{
			Path: absPath,
		}
		s.config.Repositories[absPath] = repo
	}

	repo.SelectedToken = tokenID

	return s.saveConfig()
}

// GetSelectedToken gets the selected token ID for a repository
func (s *AppConfigService) GetSelectedToken(repoPath string) (string, error) {
	if repoPath == "" {
		return "", fmt.Errorf("repository path cannot be empty")
	}

	s.mutex.RLock()
	defer s.mutex.RUnlock()

	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to get absolute path: %w", err)
	}

	repo, exists := s.config.Repositories[absPath]
	if !exists || repo.SelectedToken == "" {
		return "", nil
	}

	return repo.SelectedToken, nil
}

// ClearSelectedToken clears the selected token for a repository
func (s *AppConfigService) ClearSelectedToken(repoPath string) error {
	if repoPath == "" {
		return fmt.Errorf("repository path cannot be empty")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	absPath, err := filepath.Abs(repoPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	repo, exists := s.config.Repositories[absPath]
	if !exists {
		return nil
	}

	repo.SelectedToken = ""
	return s.saveConfig()
}

// ClearTokenFromAllRepos clears a specific token ID from all repository configurations
func (s *AppConfigService) ClearTokenFromAllRepos(tokenID string) error {
	if tokenID == "" {
		return nil
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	modified := false
	for _, repo := range s.config.Repositories {
		if repo.SelectedToken == tokenID {
			repo.SelectedToken = ""
			modified = true
		}
	}

	if modified {
		return s.saveConfig()
	}

	return nil
}
