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
	ctx      context.Context
	executor *git.Executor
}

// NewRemoteService creates a new remote service
func NewRemoteService(repoService *RepositoryService) *RemoteService {
	return &RemoteService{
		executor: nil, // Will be set when repository is opened
	}
}

// Startup is called when the app starts
func (s *RemoteService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// SetExecutor sets the Git executor (called when repository changes)
func (s *RemoteService) SetExecutor(executor *git.Executor) {
	s.executor = executor
}

// Pull pulls changes from remote repository
func (s *RemoteService) Pull(remote, branch string, rebase bool) error {
	if s.executor == nil {
		return fmt.Errorf("no repository opened")
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

	_, err := s.executor.Execute(s.ctx, args...)
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

	args := []string{"push"}

	if force {
		args = append(args, "--force")
	}

	if setUpstream {
		args = append(args, "--set-upstream")
	}

	if remote != "" {
		args = append(args, remote)
		if branch != "" {
			args = append(args, branch)
		}
	}

	_, err := s.executor.Execute(s.ctx, args...)
	if err != nil {
		return fmt.Errorf("failed to push: %w", err)
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
