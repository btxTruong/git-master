package main

import (
	"context"
	"git-master/backend/models"
	"git-master/backend/services"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx               context.Context
	repositoryService *services.RepositoryService
	commitService     *services.CommitService
	stagingService    *services.StagingService
	remoteService     *services.RemoteService
}

// NewApp creates a new App application struct
func NewApp() *App {
	repoService := services.NewRepositoryService()
	commitService := services.NewCommitService(nil)
	stagingService := services.NewStagingService(repoService)
	remoteService := services.NewRemoteService(repoService)

	// Link services together so they can share the executor
	repoService.SetStagingService(stagingService)
	repoService.SetRemoteService(remoteService)
	repoService.SetCommitService(commitService)

	return &App{
		repositoryService: repoService,
		commitService:     commitService,
		stagingService:    stagingService,
		remoteService:     remoteService,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.repositoryService.Startup(ctx)
	if a.commitService != nil {
		a.commitService.Startup(ctx)
	}
	if a.remoteService != nil {
		a.remoteService.Startup(ctx)
	}
}

// GetRepositoryService returns the repository service for Wails binding
func (a *App) GetRepositoryService() *services.RepositoryService {
	return a.repositoryService
}

// GetStagingService returns the staging service for Wails binding
func (a *App) GetStagingService() *services.StagingService {
	return a.stagingService
}

// GetCommitService returns the commit service for Wails binding
func (a *App) GetCommitService() *services.CommitService {
	return a.commitService
}

// OpenDirectoryDialog opens a directory selection dialog and opens the repository
func (a *App) OpenDirectoryDialog() (*models.Repository, error) {
	dirPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Git Repository",
	})

	if err != nil {
		return nil, err
	}

	if dirPath == "" {
		// User cancelled
		return nil, nil
	}

	// Open the repository
	return a.repositoryService.OpenRepository(dirPath)
}
