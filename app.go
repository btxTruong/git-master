package main

import (
	"context"
	"git-master/backend/services"
)

// App struct
type App struct {
	ctx               context.Context
	repositoryService *services.RepositoryService
	commitService     *services.CommitService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		repositoryService: services.NewRepositoryService(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.repositoryService.Startup(ctx)
}

// GetRepositoryService returns the repository service for Wails binding
func (a *App) GetRepositoryService() *services.RepositoryService {
	return a.repositoryService
}
