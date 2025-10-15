package services

import (
	"context"
	"fmt"
	"git-master/backend/git"
	"strings"
)

// Remote represents a Git remote
type Remote struct {
	Name    string `json:"name"`
	URL     string `json:"url"`
	PushURL string `json:"pushUrl,omitempty"`
}

// RemoteService handles remote operations
type RemoteService struct {
	ctx               context.Context
	executor          *git.Executor
	credentialsService *CredentialsService
	configService     *ConfigService
	repoPath          string // Current repository path
}

// NewRemoteService creates a new remote service
func NewRemoteService(repoService *RepositoryService, credentialsService *CredentialsService, configService *ConfigService) *RemoteService {
	return &RemoteService{
		executor:          nil, // Will be set when repository is opened
		credentialsService: credentialsService,
		configService:     configService,
	}
}

// SetRepositoryPath sets the current repository path
func (s *RemoteService) SetRepositoryPath(repoPath string) {
	s.repoPath = repoPath
}

// Startup is called when the app starts
func (s *RemoteService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetExecutor sets the Git executor (called when repository changes)
func (s *RemoteService) SetExecutor(executor *git.Executor) {
	s.executor = executor
}

// getGitHubToken retrieves the GitHub token from the credentials service for a given remote
// It will prioritize: 1) User-selected token for this repo, 2) Pattern-matched token, 3) Legacy token
func (s *RemoteService) getGitHubToken(remoteName string) (string, error) {
	if s.credentialsService == nil {
		return "", nil // No credentials service available
	}

	// Get the remote URL
	var remoteURL string
	if remoteName != "" {
		result, err := s.executor.Execute(s.ctx, "remote", "get-url", remoteName)
		if err == nil {
			remoteURL = strings.TrimSpace(result.Stdout)
		}
	}

	// Get selected token ID from config if available
	var selectedTokenID string
	if s.configService != nil && s.repoPath != "" {
		selectedTokenID, _ = s.configService.GetSelectedToken(s.repoPath)
	}

	// Try to get a token specific to this repository
	if remoteURL != "" {
		token, err := s.credentialsService.GetGitHubTokenForRepoWithSelection(remoteURL, selectedTokenID)
		if err == nil && token != "" {
			return token, nil
		}
	}

	// Fall back to legacy single token
	token, err := s.credentialsService.GetGitHubToken()
	if err != nil {
		return "", fmt.Errorf("failed to get GitHub token: %w", err)
	}

	return token, nil
}

// GetSelectedTokenForCurrentRepo returns the selected token ID for the current repository
func (s *RemoteService) GetSelectedTokenForCurrentRepo() (string, error) {
	if s.configService == nil || s.repoPath == "" {
		return "", nil
	}
	return s.configService.GetSelectedToken(s.repoPath)
}

// SetSelectedTokenForCurrentRepo sets the selected token ID for the current repository
func (s *RemoteService) SetSelectedTokenForCurrentRepo(tokenID string) error {
	if s.configService == nil || s.repoPath == "" {
		return fmt.Errorf("config service or repository path not available")
	}
	return s.configService.SetSelectedToken(s.repoPath, tokenID)
}

// injectTokenIntoURL injects a GitHub token into an HTTPS URL
// Converts https://github.com/user/repo.git to https://token@github.com/user/repo.git
func injectTokenIntoURL(url, token string) string {
	if token == "" || !strings.HasPrefix(url, "https://github.com") {
		return url
	}
	// Replace https:// with https://token@
	return strings.Replace(url, "https://", fmt.Sprintf("https://%s@", token), 1)
}

// Pull pulls changes from remote repository
func (s *RemoteService) Pull(remote, branch string, rebase bool) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	// Get the GitHub token and inject it into the remote URL if available
	token, err := s.getGitHubToken(remote)
	if err != nil {
		return err
	}

	// If we have a token and a remote is specified, use a temporary remote
	useTokenRemote := token != "" && remote != ""
	tempRemoteName := ""

	if useTokenRemote {
		// Get the current remote URL
		result, err := s.executor.Execute(s.ctx, "remote", "get-url", remote)
		if err != nil {
			return fmt.Errorf("failed to get remote URL: %w", err)
		}
		remoteURL := strings.TrimSpace(result.Stdout)

		// Inject token into URL if it's a GitHub HTTPS URL
		tokenURL := injectTokenIntoURL(remoteURL, token)

		if tokenURL != remoteURL {
			// Create a temporary remote with the token-injected URL
			tempRemoteName = fmt.Sprintf("temp-pull-%s", remote)

			// Add temporary remote
			_, err = s.executor.Execute(s.ctx, "remote", "add", tempRemoteName, tokenURL)
			if err != nil {
				return fmt.Errorf("failed to add temporary remote: %w", err)
			}

			// Ensure we remove the temporary remote even if pull fails
			defer func() {
				s.executor.Execute(s.ctx, "remote", "remove", tempRemoteName)
			}()

			// Use the temporary remote for pulling
			remote = tempRemoteName
		}
	}

	args := []string{"pull"}

	if rebase {
		args = append(args, "--rebase")
	}

	if remote != "" {
		args = append(args, remote)
		if branch != "" {
			args = append(args, branch)
		}
	}

	_, err = s.executor.Execute(s.ctx, args...)
	if err != nil {
		return fmt.Errorf("failed to pull: %w", err)
	}

	return nil
}

// Push pushes changes to remote repository
func (s *RemoteService) Push(remote, branch string, force, setUpstream bool) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	// Trim whitespace from inputs
	remote = strings.TrimSpace(remote)
	branch = strings.TrimSpace(branch)

	// If no branch specified, use current branch
	currentBranch := branch
	if currentBranch == "" {
		result, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
		if err != nil {
			return fmt.Errorf("failed to get current branch: %w", err)
		}
		currentBranch = strings.TrimSpace(result.Stdout)
	}

	// If no remote specified, try to get the upstream remote for the current branch
	currentRemote := remote
	if currentRemote == "" {
		// Try to get the upstream remote
		result, err := s.executor.Execute(s.ctx, "config", fmt.Sprintf("branch.%s.remote", currentBranch))
		if err == nil && result.Stdout != "" {
			currentRemote = strings.TrimSpace(result.Stdout)
		} else {
			// Default to "origin" if no upstream configured
			currentRemote = "origin"
		}
	}

	// Get the GitHub token and inject it into the remote URL if available
	token, err := s.getGitHubToken(currentRemote)
	if err != nil {
		return err
	}

	// If we have a token, we need to use a temporary remote with the token-injected URL
	useTokenRemote := token != ""
	tempRemoteName := ""

	if useTokenRemote {
		// Get the current remote URL
		result, err := s.executor.Execute(s.ctx, "remote", "get-url", currentRemote)
		if err != nil {
			return fmt.Errorf("failed to get remote URL: %w", err)
		}
		remoteURL := strings.TrimSpace(result.Stdout)

		// Inject token into URL if it's a GitHub HTTPS URL
		tokenURL := injectTokenIntoURL(remoteURL, token)

		if tokenURL != remoteURL {
			// Create a temporary remote with the token-injected URL
			tempRemoteName = fmt.Sprintf("temp-push-%s", currentRemote)

			// Add temporary remote
			_, err = s.executor.Execute(s.ctx, "remote", "add", tempRemoteName, tokenURL)
			if err != nil {
				return fmt.Errorf("failed to add temporary remote: %w", err)
			}

			// Ensure we remove the temporary remote even if push fails
			defer func() {
				s.executor.Execute(s.ctx, "remote", "remove", tempRemoteName)
			}()

			// Use the temporary remote for pushing
			currentRemote = tempRemoteName
		}
	}

	args := []string{"push"}

	if force {
		args = append(args, "--force")
	}

	if setUpstream && tempRemoteName == "" {
		// Only set upstream if not using a temporary remote
		args = append(args, "--set-upstream")
	}

	// Always specify remote and branch for clarity
	args = append(args, currentRemote, currentBranch)

	result, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		// Check if it's an authentication error
		isAuthError := false
		if result != nil && result.Stderr != "" {
			stderr := strings.ToLower(result.Stderr)
			if strings.Contains(stderr, "permission denied") ||
				strings.Contains(stderr, "authentication failed") ||
				strings.Contains(stderr, "403") ||
				strings.Contains(stderr, "401") ||
				strings.Contains(stderr, "unauthorized") {
				isAuthError = true
			}
		}

		if isAuthError {
			return fmt.Errorf("AUTHENTICATION_REQUIRED: Failed to push to %s/%s. Authentication failed. Please configure a GitHub token in Settings > Security", currentRemote, currentBranch)
		}

		// Include both stdout and stderr in error message for better debugging
		errorMsg := fmt.Sprintf("failed to push to %s/%s", currentRemote, currentBranch)
		if result != nil {
			if result.Stderr != "" {
				errorMsg += fmt.Sprintf(": %s", result.Stderr)
			}
			if result.Stdout != "" {
				errorMsg += fmt.Sprintf(" (stdout: %s)", result.Stdout)
			}
		}
		return fmt.Errorf("%s: %w", errorMsg, err)
	}

	return nil
}

// Fetch fetches changes from remote repository
func (s *RemoteService) Fetch(remote string, prune bool) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	args := []string{"fetch"}

	if prune {
		args = append(args, "--prune")
	}

	if remote != "" {
		args = append(args, remote)
	} else {
		args = append(args, "--all")
	}

	_, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return fmt.Errorf("failed to fetch: %w", err)
	}

	return nil
}

// GetRemotes retrieves list of remotes
func (s *RemoteService) GetRemotes() ([]Remote, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	result, err := s.executor.Execute(s.ctx, "remote", "-v")
	if err != nil {
		return nil, fmt.Errorf("failed to get remotes: %w", err)
	}

	remotes := []Remote{}
	remoteMap := make(map[string]*Remote)

	if result.Stdout != "" {
		lines := strings.Split(strings.TrimSpace(result.Stdout), "\n")
		for _, line := range lines {
			parts := strings.Fields(line)
			if len(parts) < 3 {
				continue
			}

			name := parts[0]
			url := parts[1]
			urlType := strings.Trim(parts[2], "()")

			if _, exists := remoteMap[name]; !exists {
				remoteMap[name] = &Remote{
					Name: name,
				}
			}

			if urlType == "fetch" {
				remoteMap[name].URL = url
			} else if urlType == "push" {
				remoteMap[name].PushURL = url
			}
		}
	}

	// Convert map to slice
	for _, remote := range remoteMap {
		remotes = append(remotes, *remote)
	}

	return remotes, nil
}

// AddRemote adds a new remote
func (s *RemoteService) AddRemote(name, url string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "remote", "add", name, url)
	if err != nil {
		return fmt.Errorf("failed to add remote: %w", err)
	}

	return nil
}

// RemoveRemote removes a remote
func (s *RemoteService) RemoveRemote(name string) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
	}

	_, err := s.executor.Execute(s.ctx, "remote", "remove", name)
	if err != nil {
		return fmt.Errorf("failed to remove remote: %w", err)
	}

	return nil
}

// GetUnpushedCommitsCount returns the number of commits ahead of the remote branch
func (s *RemoteService) GetUnpushedCommitsCount(branch string) (int, error) {
	if s.executor == nil {
		return 0, fmt.Errorf("no repository opened")
	}

	// Trim whitespace and newlines from branch name
	branch = strings.TrimSpace(branch)

	// If no branch specified, use current branch
	if branch == "" {
		result, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
		if err != nil {
			return 0, fmt.Errorf("failed to get current branch: %w", err)
		}
		branch = strings.TrimSpace(result.Stdout)
	}

	// Get the upstream branch
	result, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", fmt.Sprintf("%s@{upstream}", branch))
	if err != nil {
		// No upstream configured
		return 0, nil
	}
	upstream := strings.TrimSpace(result.Stdout)

	// Count commits ahead
	result, err = s.executor.Execute(s.ctx, "rev-list", "--count", fmt.Sprintf("%s..%s", upstream, branch))
	if err != nil {
		return 0, fmt.Errorf("failed to count commits: %w", err)
	}

	var count int
	_, err = fmt.Sscanf(strings.TrimSpace(result.Stdout), "%d", &count)
	if err != nil {
		return 0, fmt.Errorf("failed to parse count: %w", err)
	}

	return count, nil
}

// GetUnpushedCommits returns the list of commits that haven't been pushed to the remote
func (s *RemoteService) GetUnpushedCommits(branch string) ([]string, error) {
	if s.executor == nil {
		return nil, fmt.Errorf("no repository opened")
	}

	// Trim whitespace and newlines from branch name
	branch = strings.TrimSpace(branch)

	// If no branch specified, use current branch
	if branch == "" {
		result, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", "HEAD")
		if err != nil {
			return nil, fmt.Errorf("failed to get current branch: %w", err)
		}
		branch = strings.TrimSpace(result.Stdout)
	}

	// Get the upstream branch
	result, err := s.executor.Execute(s.ctx, "rev-parse", "--abbrev-ref", fmt.Sprintf("%s@{upstream}", branch))
	if err != nil {
		// No upstream configured
		return []string{}, nil
	}
	upstream := strings.TrimSpace(result.Stdout)

	// Get commit hashes that are ahead
	// Format: %H = full commit hash
	result, err = s.executor.Execute(s.ctx, "rev-list", "--pretty=format:%H", fmt.Sprintf("%s..%s", upstream, branch))
	if err != nil {
		return nil, fmt.Errorf("failed to get commit list: %w", err)
	}

	if result.Stdout == "" {
		return []string{}, nil
	}

	lines := strings.Split(strings.TrimSpace(result.Stdout), "\n")
	hashes := []string{}

	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Skip "commit" lines from --pretty output
		if line != "" && !strings.HasPrefix(line, "commit ") {
			hashes = append(hashes, line)
		}
	}

	return hashes, nil
}
