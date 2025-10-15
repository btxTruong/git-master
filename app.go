package main

import (
	"context"
	"git-master/backend/models"
	"git-master/backend/services"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx                 context.Context
	repositoryService   *services.RepositoryService
	commitService       *services.CommitService
	stagingService      *services.StagingService
	remoteService       *services.RemoteService
	changelistService   *services.ChangelistService
	diffService         *services.DiffService
	archiveService      *services.ArchiveService
	blameService        *services.BlameService
	credentialsService  *services.CredentialsService
	configService       *services.ConfigService
}

// NewApp creates a new App application struct
func NewApp() *App {
	repoService := services.NewRepositoryService()
	commitService := services.NewCommitService(nil)
	stagingService := services.NewStagingService(repoService)
	credentialsService := services.NewCredentialsService()
	configService := services.NewConfigService()
	remoteService := services.NewRemoteService(repoService, credentialsService, configService)
	changelistService := services.NewChangelistService()
	diffService := services.NewDiffService(stagingService)
	archiveService := services.NewArchiveService(diffService, stagingService)
	blameService := services.NewBlameService()

	// Link services together so they can share the executor
	repoService.SetStagingService(stagingService)
	repoService.SetRemoteService(remoteService)
	repoService.SetCommitService(commitService)
	repoService.SetDiffService(diffService)
	repoService.SetArchiveService(archiveService)
	repoService.SetBlameService(blameService)
	credentialsService.SetConfigService(configService)

	return &App{
		repositoryService:  repoService,
		commitService:      commitService,
		stagingService:     stagingService,
		remoteService:      remoteService,
		changelistService:  changelistService,
		diffService:        diffService,
		archiveService:     archiveService,
		blameService:       blameService,
		credentialsService: credentialsService,
		configService:      configService,
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
	if a.changelistService != nil {
		a.changelistService.Startup(ctx)
	}
	if a.diffService != nil {
		a.diffService.Startup(ctx)
	}
	if a.archiveService != nil {
		a.archiveService.Startup(ctx)
	}
	if a.blameService != nil {
		a.blameService.Startup(ctx)
	}
	if a.credentialsService != nil {
		a.credentialsService.Startup(ctx)
	}
	if a.configService != nil {
		a.configService.Startup(ctx)
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

// GetChangelistService returns the changelist service for Wails binding
func (a *App) GetChangelistService() *services.ChangelistService {
	return a.changelistService
}

// GetDiffService returns the diff service for Wails binding
func (a *App) GetDiffService() *services.DiffService {
	return a.diffService
}

// GetArchiveService returns the archive service for Wails binding
func (a *App) GetArchiveService() *services.ArchiveService {
	return a.archiveService
}

// GetBlameService returns the blame service for Wails binding
func (a *App) GetBlameService() *services.BlameService {
	return a.blameService
}

// GetCredentialsService returns the credentials service for Wails binding
func (a *App) GetCredentialsService() *services.CredentialsService {
	return a.credentialsService
}

// GetConfigService returns the config service for Wails binding
func (a *App) GetConfigService() *services.ConfigService {
	return a.configService
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

// SelectSaveDirectory opens a directory selection dialog for saving files
func (a *App) SelectSaveDirectory() (string, error) {
	dirPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Directory to Save Patch File",
	})

	if err != nil {
		return "", err
	}

	return dirPath, nil
}

// SaveFileDialog opens a file save dialog
func (a *App) SaveFileDialog(defaultFilename string) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Patch File",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Patch Files (*.patch)",
				Pattern:     "*.patch",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return "", err
	}

	return filePath, nil
}
