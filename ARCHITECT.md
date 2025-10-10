# Complete Architecture Plan: Git Management Application with Wails

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Wails Application                        │
├───────────────────────┬─────────────────────────────────────┤
│   React Frontend      │      Go Backend                     │
│   (TypeScript)        │                                     │
│                       │                                     │
│  ┌─────────────────┐  │  ┌──────────────────────────────┐  │
│  │  UI Components  │◄─┼──┤  Wails Bindings              │  │
│  │  - CommitList   │  │  │  (JSON-RPC Bridge)           │  │
│  │  - DiffViewer   │  │  └────────────┬─────────────────┘  │
│  │  - BranchTree   │  │               │                    │
│  │  - MergeDialog  │  │  ┌────────────▼─────────────────┐  │
│  └────────┬────────┘  │  │  Services Layer              │  │
│           │           │  │  - RepositoryService         │  │
│  ┌────────▼────────┐  │  │  - CommitService             │  │
│  │  Zustand Stores │  │  │  - BranchService             │  │
│  │  - Repository   │  │  │  - DiffService               │  │
│  │  - Commits      │  │  │  - MergeService              │  │
│  └─────────────────┘  │  └────────────┬─────────────────┘  │
│                       │               │                    │
│                       │  ┌────────────▼─────────────────┐  │
│                       │  │  Git Executor (os/exec)      │  │
│                       │  │  Wraps native Git commands   │  │
│                       │  └──────────────────────────────┘  │
└───────────────────────┴─────────────────────────────────────┘
```

## Technology Stack Decisions

### Backend (Go)
- **Framework**: Wails v2
- **Git Integration**: `os/exec` wrapper (same approach as JetBrains IDE)
  - Maximum compatibility with all Git features
  - Proven reliability for complex operations (merge, rebase)
  - Simple implementation for command execution
- **Data Models**: Strongly-typed structs for Commit, Branch, Diff, Repository

### Frontend (React + TypeScript)
- **State Management**: Zustand v4 (lightweight, performant)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v3
- **UI Primitives**: Headless UI + Radix UI
- **Code Highlighting**: react-syntax-highlighter with Prism
- **Virtualization**: @tanstack/react-virtual (for large lists)
- **Icons**: Lucide React

## Project Structure

```
git-master/
├── backend/
│   ├── services/
│   │   ├── RepositoryService.go    # Open/switch repos
│   │   ├── CommitService.go        # Commit history & details
│   │   ├── BranchService.go        # Branch operations
│   │   ├── DiffService.go          # Diff generation
│   │   └── MergeService.go         # Merge & conflicts
│   ├── models/
│   │   ├── Commit.go
│   │   ├── Branch.go
│   │   ├── DiffResult.go
│   │   └── Repository.go
│   └── git/
│       ├── executor.go             # Git command wrapper
│       └── parser.go               # Output parsing
│
└── frontend/
    └── src/
        ├── api/                    # Wails bindings
        ├── components/
        │   ├── commit/             # CommitList, CommitDetail, CommitGraph
        │   ├── diff/               # DiffViewer, FileDiff, SplitView
        │   ├── branch/             # BranchList, BranchTree
        │   └── merge/              # MergeDialog, ConflictResolver
        ├── stores/                 # Zustand state management
        ├── views/                  # Main application views
        └── utils/
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Working application that can display commit history

- Set up Wails project with React + TypeScript
- Create GitService with `git log` execution
- Build CommitList UI with pagination
- Implement repository selection dialog

**Deliverable**: Open a repo and browse commits

---

### Phase 2: Core Viewing (Week 2)
**Goal**: View code changes and diffs

- Implement DiffService for file changes
- Build DiffViewer with syntax highlighting
- Add file tree for changed files
- Create commit detail view with metadata
- Display branch list

**Deliverable**: Browse commits and view diffs

---

### Phase 3: Basic Operations (Week 3)
**Goal**: Perform standard Git workflows

- Create/delete/switch branches
- Checkout functionality
- Stage/unstage files
- Commit dialog (message, amend)
- Pull/push operations

**Deliverable**: Complete basic Git workflows

---

### Phase 4: Advanced Operations (Week 4)
**Goal**: Handle complex Git scenarios

- Merge functionality with conflict detection
- ConflictResolver UI (three-pane view)
- Rebase operations
- Stash management
- Cherry-pick support

**Deliverable**: Handle complex Git operations

---

### Phase 5: Polish (Week 5)
**Goal**: Production-ready application

- Commit graph visualization
- Search and filters
- Performance optimization for large repos
- Keyboard shortcuts
- Settings/preferences panel

**Deliverable**: Production-ready MVP

---

### Phase 6: Future Enhancements
- GitHub authentication (OAuth + token)
- Remote repository management
- Git blame integration
- Tags and releases

## Key Technical Patterns

### Git Command Execution
```go
type GitExecutor struct {
    repoPath string
}

func (g *GitExecutor) Execute(args ...string) (*GitResult, error) {
    cmd := exec.Command("git", args...)
    cmd.Dir = g.repoPath
    // Handle stdout, stderr, exit codes
    // Emit progress events for long operations
}
```

### Wails Event System
```go
// Backend: Emit progress
runtime.EventsEmit(ctx, "git:progress", progressData)

// Frontend: Listen for updates
runtime.EventsOn("git:progress", (data) => {
    updateProgressBar(data)
})
```

### Performance Strategies
1. **Pagination**: Load 100 commits at a time
2. **Virtualization**: Only render visible rows in lists
3. **Debouncing**: Delay search/filter operations
4. **Caching**: Store frequently accessed data in Zustand

## Getting Started (First Steps)

### 1. Environment Setup
```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Create new project
wails init -n git-master -t react-ts

# Navigate to project
cd git-master

# Run development server
wails dev
```

### 2. Install Frontend Dependencies
```bash
cd frontend

# State management & routing
npm install zustand react-router-dom

# UI components & styling
npm install @headlessui/react lucide-react
npm install -D tailwindcss postcss autoprefixer

# Code highlighting & virtualization
npm install react-syntax-highlighter @types/react-syntax-highlighter
npm install @tanstack/react-virtual
```

### 3. Create Project Structure
```bash
# Backend
mkdir -p backend/{services,models,git}

# Frontend
mkdir -p frontend/src/{api,components,stores,views,utils}
mkdir -p frontend/src/components/{commit,diff,branch,merge}
```

### 4. First Feature: Repository Opening
- Create `RepositoryService.go` with `OpenRepository` method
- Add file dialog for repository selection
- Display repository name and current branch
- Test with an actual Git repository

### 5. Second Feature: Commit History
- Implement `CommitService.GetCommits(limit, offset)`
- Parse `git log --pretty=format:...` output
- Create virtualized `CommitList` component
- Display: hash, author, date, message
- Test with 1000+ commits for performance

## Success Criteria

**Week 1 Goals**:
- Application launches successfully
- Can open Git repositories via file dialog
- Displays paginated commit history
- UI is responsive and performant
- No lag with 1000+ commits
