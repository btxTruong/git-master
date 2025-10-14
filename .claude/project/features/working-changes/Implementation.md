# Implementation Plan: Working Changes Feature

## Technology Stack

### Backend (Go)
- **Language**: Go 1.23
- **Framework**: Wails v2.10.2
- **Key Libraries**:
  - Standard library: `os/exec`, `encoding/json`, `path/filepath`, `sync`
  - No additional dependencies required (uses existing Git operations)

### Frontend (React/TypeScript)
- **Language**: TypeScript 4.6.4
- **Framework**: React 18.2.0
- **State Management**: Zustand 5.0.8
- **UI Components**:
  - Headless UI 2.2.9 (dialogs, dropdowns)
  - Radix UI (context menus, select)
  - Lucide React 0.545.0 (icons)
- **Utilities**:
  - date-fns 4.1.0 (timestamps)
  - react-hot-toast 2.6.0 (notifications)

### File System
- **Persistence Format**: JSON
- **Archive Format**: Git unified diff (patch)
- **Storage Locations**:
  - Changelists: `{repo}/.git-master/changelists.json`
  - Archives: `~/.git-master/{repo-name}/{archive_name}.diff`
  - Archive metadata: `~/.git-master/{repo-name}/{archive_name}.meta.json`

## Architecture

### Overall System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     React/TypeScript Frontend               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ChangesView  │  │ ArchivesView │  │ Context Menu │     │
│  │   (Tab 1)    │  │   (Tab 2)    │  │  Component   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼────────┐   │
│  │         changelistStore (Zustand)                    │   │
│  │  - Custom groups state                               │   │
│  │  - Path-to-group mappings                            │   │
│  │  - Actions (create, move, archive, restore)          │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         stagingStore (Zustand) - EXISTING            │   │
│  │  - Staged files (derived "tracked" group)            │   │
│  │  - Unstaged files                                     │   │
│  │  - Untracked files (derived "untracked" group)       │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │ Wails RPC
┌─────────────────────────▼────────────────────────────────────┐
│                      Go Backend (Wails)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │     changelistService (NEW)                        │     │
│  │  - Load/Save JSON (atomic writes)                  │     │
│  │  - Lock file management                            │     │
│  │  - Archive creation/restoration                    │     │
│  │  - Group CRUD operations                           │     │
│  │  - Path reconciliation                             │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐     │
│  │     stagingService (EXISTING - Extended)           │     │
│  │  - Git status (porcelain v2)                       │     │
│  │  - Stage/unstage operations                        │     │
│  │  - File diff generation                            │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐     │
│  │     diffService (NEW)                              │     │
│  │  - Generate diffs for custom groups                │     │
│  │  - Unified diff parsing                            │     │
│  │  - Binary file handling                            │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐     │
│  │     gitExecutor (EXISTING)                         │     │
│  │  - Execute git commands                            │     │
│  │  - Command output parsing                          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    Git Repository                            │
│  - Working Tree                                              │
│  - Index (.git/index)                                        │
│  - Object Database                                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    File System Storage                       │
│  - .git-master/changelists.json (per repo)                  │
│  - ~/.git-master/{repo-name}/*.diff (archives)               │
│  - ~/.git-master/{repo-name}/*.meta.json (metadata)          │
└──────────────────────────────────────────────────────────────┘
```

### Data Models

#### Backend (Go)

```go
// Changelist represents a custom group of files
type Changelist struct {
    ID        string           `json:"id"`
    Name      string           `json:"name"`
    Type      ChangelistType   `json:"type"`
    CreatedAt time.Time        `json:"createdAt"`
    UpdatedAt time.Time        `json:"updatedAt"`
    Items     []ChangelistItem `json:"items"`
}

type ChangelistType string

const (
    ChangelistTypeCustom    ChangelistType = "custom"
    ChangelistTypeTracked   ChangelistType = "tracked"
    ChangelistTypeUntracked ChangelistType = "untracked"
)

// ChangelistItem represents a file in a changelist
type ChangelistItem struct {
    Path            string                  `json:"path"`
    TrackedSnapshot *FileTrackedSnapshot    `json:"trackedSnapshot,omitempty"`
    Notes           string                  `json:"notes,omitempty"`
}

// FileTrackedSnapshot captures file state at add time
type FileTrackedSnapshot struct {
    BaseOid        string `json:"baseOid,omitempty"`
    LastSeenStatus string `json:"lastSeenStatus,omitempty"`
    LastSeenSha256 string `json:"lastSeenSha256,omitempty"`
}

// ChangelistConfig represents the persisted changelist data
type ChangelistConfig struct {
    Version int          `json:"version"`
    Groups  []Changelist `json:"groups"`
}

// ArchiveMetadata stores metadata for archived groups
type ArchiveMetadata struct {
    CreatedAt       time.Time `json:"createdAt"`
    RepoName        string    `json:"repoName"`
    RepoPath        string    `json:"repoPath"`
    Branch          string    `json:"branch"`
    HeadOid         string    `json:"headOid"`
    SourceGroupID   string    `json:"sourceGroupId"`
    SourceGroupName string    `json:"sourceGroupName"`
    Paths           []string  `json:"paths"`
    DiffSource      string    `json:"diffSource"` // "index" | "working" | "mixed"
    ToolVersion     string    `json:"toolVersion"`
}

// ArchiveInfo represents an archive with its metadata
type ArchiveInfo struct {
    Name     string          `json:"name"`
    Path     string          `json:"path"`
    Metadata ArchiveMetadata `json:"metadata"`
}
```

#### Frontend (TypeScript)

```typescript
// Changelist types
export interface Changelist {
  id: string;
  name: string;
  type: ChangelistType;
  createdAt: string;
  updatedAt: string;
  items: ChangelistItem[];
}

export type ChangelistType = 'custom' | 'tracked' | 'untracked';

export interface ChangelistItem {
  path: string;
  trackedSnapshot?: FileTrackedSnapshot;
  notes?: string;
}

export interface FileTrackedSnapshot {
  baseOid?: string;
  lastSeenStatus?: string;
  lastSeenSha256?: string;
}

// Archive types
export interface ArchiveMetadata {
  createdAt: string;
  repoName: string;
  repoPath: string;
  branch: string;
  headOid: string;
  sourceGroupId: string;
  sourceGroupName: string;
  paths: string[];
  diffSource: 'index' | 'working' | 'mixed';
  toolVersion: string;
}

export interface ArchiveInfo {
  name: string;
  path: string;
  metadata: ArchiveMetadata;
}

// Store state types
export interface ChangelistState {
  groups: Changelist[];
  pathToGroupIds: Map<string, string[]>;
  selectedGroupId: string | null;
  selectedFilePath: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadChangelists: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  renameGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string, archiveFirst?: boolean) => Promise<void>;
  addPathsToGroup: (groupId: string, paths: string[]) => Promise<void>;
  removePathsFromGroup: (groupId: string, paths: string[]) => Promise<void>;
  movePathsBetweenGroups: (sourceId: string, targetId: string, paths: string[]) => Promise<void>;
  archiveGroup: (groupId: string, archiveName: string) => Promise<void>;
  setSelectedGroup: (groupId: string | null) => void;
  setSelectedFile: (path: string | null) => void;
}

export interface ArchiveState {
  archives: ArchiveInfo[];
  selectedArchive: ArchiveInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadArchives: () => Promise<void>;
  restoreArchive: (archiveName: string, options: RestoreOptions) => Promise<void>;
  createGroupFromArchive: (archiveName: string) => Promise<void>;
  renameArchive: (oldName: string, newName: string) => Promise<void>;
  deleteArchive: (archiveName: string) => Promise<void>;
  setSelectedArchive: (archive: ArchiveInfo | null) => void;
}

export interface RestoreOptions {
  threeWay?: boolean;
  backupTouchedPaths?: boolean;
}
```

### Component Architecture

#### Frontend Components Hierarchy

```
App
├── ChangesView (Tab 1)
│   ├── ChangelistPanel
│   │   ├── ChangelistGroup (tracked - derived)
│   │   │   └── FileTree
│   │   │       └── FileItem
│   │   │           └── ContextMenu
│   │   ├── ChangelistGroup (untracked - derived)
│   │   │   └── FileTree
│   │   │       └── FileItem
│   │   │           └── ContextMenu
│   │   └── ChangelistGroup[] (custom groups)
│   │       └── FileTree
│   │           └── FileItem
│   │               └── ContextMenu
│   ├── DiffPreviewPane
│   │   └── DiffViewer (reuse existing)
│   └── GroupActionsToolbar
│       ├── CreateGroupButton
│       └── GroupActionsMenu
│
└── ArchivesView (Tab 2)
    ├── ArchiveList
    │   └── ArchiveItem
    │       ├── ArchiveMetadataDisplay
    │       └── ContextMenu
    ├── ArchiveDiffPreview
    │   └── DiffViewer (reuse existing)
    └── ArchiveActionsToolbar
        └── ImportPatchButton
```

### Service Layer Architecture

#### Backend Services

```
changelistService
├── CRUD Operations
│   ├── LoadChangelists(repoPath) → ChangelistConfig
│   ├── SaveChangelists(repoPath, config) → error
│   ├── CreateGroup(repoPath, name) → Changelist
│   ├── RenameGroup(repoPath, id, name) → error
│   ├── DeleteGroup(repoPath, id) → error
│   ├── AddPathsToGroup(repoPath, groupId, paths) → error
│   ├── RemovePathsFromGroup(repoPath, groupId, paths) → error
│   └── MovePathsBetweenGroups(repoPath, sourceId, targetId, paths) → error
│
├── Archive Operations
│   ├── ArchiveGroup(repoPath, groupId, archiveName) → ArchiveInfo
│   ├── ListArchives(repoPath) → []ArchiveInfo
│   ├── GetArchiveMetadata(archivePath) → ArchiveMetadata
│   ├── RestoreArchive(repoPath, archivePath, options) → error
│   ├── RenameArchive(repoPath, oldName, newName) → error
│   └── DeleteArchive(repoPath, archiveName) → error
│
├── Reconciliation
│   ├── ReconcileChangelists(repoPath, gitStatus) → error
│   └── HandleRenames(repoPath, renames) → error
│
└── Internal Helpers
    ├── acquireLock(repoPath) → (unlock func, error)
    ├── atomicWrite(path, data) → error
    ├── sanitizeArchiveName(name) → string
    └── getArchiveDir(repoPath) → string

diffService
├── GetGroupDiff(repoPath, groupId, options) → string
├── GetFileDiff(repoPath, path, source) → string
├── GeneratePatchForPaths(repoPath, paths, source) → string
└── ParseDiff(diffText) → DiffResult

stagingService (EXISTING - Extended)
├── GetStatus() → WorkingDirectoryStatus [EXISTING]
├── StageFile(path) → error [EXISTING]
├── UnstageFile(path) → error [EXISTING]
├── StagePaths(paths[]) → error [NEW]
├── UnstagePaths(paths[]) → error [NEW]
├── GetStatusForPaths(paths[]) → []FileStatus [NEW]
└── RevertFile(path, options) → error [NEW]
```

### State Management Strategy

#### Zustand Store Architecture

```typescript
// changelistStore.ts
// Manages custom groups only; derives tracked/untracked from stagingStore
const useChangelistStore = create<ChangelistState>((set, get) => ({
  groups: [],
  pathToGroupIds: new Map(),
  selectedGroupId: null,
  selectedFilePath: null,
  isLoading: false,
  error: null,

  // Implementation details in tasks
}));

// Selectors for derived groups
export const selectTrackedGroup = () => {
  const stagedFiles = useStagingStore.getState().stagedFiles;
  return {
    id: 'tracked',
    name: 'Tracked',
    type: 'tracked' as const,
    items: stagedFiles.map(f => ({ path: f.path })),
  };
};

export const selectUntrackedGroup = () => {
  const untrackedFiles = useStagingStore.getState().untrackedFiles;
  return {
    id: 'untracked',
    name: 'Untracked',
    type: 'untracked' as const,
    items: untrackedFiles.map(f => ({ path: f.path })),
  };
};
```

#### State Synchronization Strategy

1. **Git Status Changes** (via existing polling or fsnotify):
   - `stagingStore` updates `stagedFiles`, `unstagedFiles`, `untrackedFiles`
   - Derived groups (`tracked`, `untracked`) auto-update via selectors
   - `changelistStore` reconciles custom groups for renames/deletions

2. **User Actions**:
   - Create/rename/delete group → Call backend → Update `changelistStore`
   - Move files → Update `pathToGroupIds` map → Call backend (if crossing tracked boundary)
   - Archive group → Call backend → Optionally remove group → Refresh archives list

3. **Persistence**:
   - All mutations to custom groups trigger immediate backend save
   - Backend handles atomic writes with lock file
   - Frontend optimistic updates with rollback on error

### Persistence Implementation

#### JSON Storage Format

```json
{
  "version": 1,
  "groups": [
    {
      "id": "f2f5e3f2-0dbb-44d6-8c87-6b25b2f3d5d1",
      "name": "Feature: User Authentication",
      "type": "custom",
      "createdAt": "2025-01-15T12:34:56Z",
      "updatedAt": "2025-01-15T14:22:10Z",
      "items": [
        {
          "path": "src/api/auth.ts",
          "trackedSnapshot": {
            "baseOid": "e3b0c44298fc1c149afbf4c8996fb924",
            "lastSeenStatus": "M"
          }
        },
        {
          "path": "src/components/Login.tsx"
        }
      ]
    }
  ]
}
```

#### Lock File Mechanism

```go
// Acquire lock with timeout
func (s *ChangelistService) acquireLock(repoPath string) (unlock func(), error error) {
    lockPath := filepath.Join(repoPath, ".git-master", "changelists.lock")

    // Try to acquire lock with 3-second timeout
    timeout := time.After(3 * time.Second)
    ticker := time.NewTicker(50 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-timeout:
            return nil, fmt.Errorf("failed to acquire lock: timeout")
        case <-ticker.C:
            // Try to create lock file exclusively
            file, err := os.OpenFile(lockPath, os.O_CREATE|os.O_EXCL, 0644)
            if err == nil {
                // Lock acquired
                file.Close()
                return func() { os.Remove(lockPath) }, nil
            }
            // Lock held by another process, retry
        }
    }
}
```

#### Atomic Write Implementation

```go
func (s *ChangelistService) atomicWrite(path string, data []byte) error {
    // Write to temporary file
    tmpPath := path + ".tmp"

    if err := os.WriteFile(tmpPath, data, 0644); err != nil {
        return fmt.Errorf("failed to write temp file: %w", err)
    }

    // Sync to disk
    file, err := os.OpenFile(tmpPath, os.O_RDWR, 0644)
    if err != nil {
        os.Remove(tmpPath)
        return fmt.Errorf("failed to open temp file for sync: %w", err)
    }

    if err := file.Sync(); err != nil {
        file.Close()
        os.Remove(tmpPath)
        return fmt.Errorf("failed to sync temp file: %w", err)
    }
    file.Close()

    // Atomic rename
    if err := os.Rename(tmpPath, path); err != nil {
        os.Remove(tmpPath)
        return fmt.Errorf("failed to rename temp file: %w", err)
    }

    return nil
}
```

### Archive Implementation Details

#### Archive Creation Algorithm

```go
func (s *ChangelistService) ArchiveGroup(repoPath, groupId, archiveName string) (*ArchiveInfo, error) {
    // 1. Resolve group to file paths
    group, err := s.getGroupByID(repoPath, groupId)
    if err != nil {
        return nil, err
    }

    // 2. Get Git status for each path
    statusMap := make(map[string]*FileStatus)
    for _, item := range group.Items {
        status, err := s.stagingService.GetStatusForPaths(repoPath, []string{item.Path})
        if err != nil {
            continue // Handle missing files gracefully
        }
        statusMap[item.Path] = status[0]
    }

    // 3. Generate patches by category
    var patchParts []string

    // Staged files
    stagedPaths := filterPathsByStatus(statusMap, "staged")
    if len(stagedPaths) > 0 {
        patch, _ := s.diffService.GeneratePatchForPaths(repoPath, stagedPaths, "index")
        patchParts = append(patchParts, patch)
    }

    // Modified tracked files
    modifiedPaths := filterPathsByStatus(statusMap, "modified")
    if len(modifiedPaths) > 0 {
        patch, _ := s.diffService.GeneratePatchForPaths(repoPath, modifiedPaths, "working")
        patchParts = append(patchParts, patch)
    }

    // Untracked files
    untrackedPaths := filterPathsByStatus(statusMap, "untracked")
    for _, path := range untrackedPaths {
        patch, _ := s.diffService.GenerateUntrackedPatch(repoPath, path)
        patchParts = append(patchParts, patch)
    }

    // 4. Combine patches
    combinedPatch := strings.Join(patchParts, "\n\n")

    // 5. Create archive metadata
    headOid, _ := s.gitExecutor.GetHeadOID(repoPath)
    branch, _ := s.gitExecutor.GetCurrentBranch(repoPath)

    metadata := ArchiveMetadata{
        CreatedAt:       time.Now(),
        RepoName:        filepath.Base(repoPath),
        RepoPath:        repoPath,
        Branch:          branch,
        HeadOid:         headOid,
        SourceGroupID:   groupId,
        SourceGroupName: group.Name,
        Paths:           extractPaths(group.Items),
        DiffSource:      determineDiffSource(statusMap),
        ToolVersion:     "1.0.0",
    }

    // 6. Write archive files atomically
    archiveDir := s.getArchiveDir(repoPath)
    os.MkdirAll(archiveDir, 0755)

    diffPath := filepath.Join(archiveDir, sanitizeArchiveName(archiveName)+".diff")
    metaPath := filepath.Join(archiveDir, sanitizeArchiveName(archiveName)+".meta.json")

    if err := s.atomicWrite(diffPath, []byte(combinedPatch)); err != nil {
        return nil, err
    }

    metaJSON, _ := json.MarshalIndent(metadata, "", "  ")
    if err := s.atomicWrite(metaPath, metaJSON); err != nil {
        os.Remove(diffPath) // Clean up diff on metadata failure
        return nil, err
    }

    return &ArchiveInfo{
        Name:     archiveName,
        Path:     diffPath,
        Metadata: metadata,
    }, nil
}
```

#### Archive Restoration Algorithm

```go
func (s *ChangelistService) RestoreArchive(repoPath, archivePath string, options RestoreOptions) error {
    // 1. Validate archive exists
    if _, err := os.Stat(archivePath); err != nil {
        return fmt.Errorf("archive not found: %w", err)
    }

    // 2. Preflight check
    cmd := exec.Command("git", "apply", "--check", archivePath)
    cmd.Dir = repoPath

    if options.ThreeWay {
        cmd.Args = append(cmd.Args, "--3way")
    }

    output, err := cmd.CombinedOutput()
    checkPassed := err == nil

    // 3. Backup if requested or preflight failed
    if options.BackupTouchedPaths || !checkPassed {
        // Get paths from metadata
        metaPath := strings.TrimSuffix(archivePath, ".diff") + ".meta.json"
        metadata, err := s.readArchiveMetadata(metaPath)
        if err != nil {
            return fmt.Errorf("failed to read metadata: %w", err)
        }

        // Create backup stash
        if err := s.createBackupStash(repoPath, metadata.Paths); err != nil {
            return fmt.Errorf("failed to create backup: %w", err)
        }
    }

    // 4. Apply patch
    applyCmd := exec.Command("git", "apply")

    if options.ThreeWay && checkPassed {
        applyCmd.Args = append(applyCmd.Args, "--3way")
    } else if !checkPassed {
        applyCmd.Args = append(applyCmd.Args, "--reject")
    }

    applyCmd.Args = append(applyCmd.Args, "--whitespace=nowarn", archivePath)
    applyCmd.Dir = repoPath

    output, err = applyCmd.CombinedOutput()
    if err != nil {
        return fmt.Errorf("failed to apply patch: %w\nOutput: %s", err, string(output))
    }

    return nil
}
```

## Implementation Phases

### Phase 1: Backend Foundation (Estimated: 24 hours)
**Tasks:** 8 tasks
**Description:** Establish core backend services for changelist management, persistence, and Git integration

**Key Deliverables:**
- Changelist data models and JSON persistence
- Lock file mechanism for concurrent access
- CRUD operations for custom groups
- Path reconciliation logic
- Basic archive creation

### Phase 2: Diff and Archive System (Estimated: 20 hours)
**Tasks:** 7 tasks
**Description:** Implement diff generation and archive creation/restoration functionality

**Key Deliverables:**
- Diff service for custom groups
- Archive creation with metadata
- Archive restoration with preflight checks
- Binary file support
- Untracked file handling

### Phase 3: Frontend State Management (Estimated: 16 hours)
**Tasks:** 5 tasks
**Description:** Build Zustand stores and integrate with backend services

**Key Deliverables:**
- Changelist store with custom group management
- Archive store for archive management
- Wails API bindings
- State synchronization logic
- Derived group selectors

### Phase 4: Changes View UI (Estimated: 28 hours)
**Tasks:** 9 tasks
**Description:** Build the main Changes tab with group management and file operations

**Key Deliverables:**
- Changelist panel with default and custom groups
- File tree within groups
- Context menu for files and groups
- Diff preview pane
- Group creation and management UI
- File movement between groups

### Phase 5: Archives View UI (Estimated: 16 hours)
**Tasks:** 5 tasks
**Description:** Build the Archives tab for managing archived groups

**Key Deliverables:**
- Archive list with metadata display
- Archive context menu actions
- Archive diff preview
- Restore and import functionality
- Archive management (rename, delete)

### Phase 6: Context Menu Actions (Estimated: 24 hours)
**Tasks:** 8 tasks
**Description:** Implement all context menu actions for files and groups

**Key Deliverables:**
- Revert file changes
- Commit from group
- Create patch from selection
- Import patch functionality
- Git blame integration
- File history integration
- Move to group action
- Archive group action

### Phase 7: Integration and Polish (Estimated: 20 hours)
**Tasks:** 6 tasks
**Description:** Integrate all components, handle edge cases, and polish UX

**Key Deliverables:**
- Git status change detection
- Auto-reconciliation logic
- Error handling and recovery
- Loading and empty states
- Keyboard shortcuts
- Performance optimization

### Phase 8: Testing and Documentation (Estimated: 16 hours)
**Tasks:** 4 tasks
**Description:** Comprehensive testing and user documentation

**Key Deliverables:**
- Unit tests for backend services
- Integration tests for workflows
- UI component tests
- User documentation
- API documentation

## Technical Considerations

### Backend-Specific Considerations

#### Go Best Practices
- **Full descriptive variable names**: `changelistConfiguration` not `cfg`, `repositoryPath` not `rp`
- **Extract magic numbers**: Define constants like `const lockAcquisitionTimeoutSeconds = 3`
- **File size limits**: Keep service files under 500 lines by extracting helpers
- **Error handling**: Return detailed errors with context using `fmt.Errorf`
- **SOLID principles**: Single responsibility for each service
- **KISS/YAGNI**: Implement only required features, avoid over-engineering

#### Git Integration Strategy
- **Porcelain v2**: Use `git status --porcelain=v2` for reliable parsing
- **Command execution**: Always set `cmd.Dir` to repository path
- **Binary handling**: Use `--binary` flag for all diff operations
- **Path normalization**: Convert all paths to POSIX-style (forward slashes)
- **Quote handling**: Use `-c core.quotepath=false` to avoid octal escapes

#### File System Operations
- **Cross-platform paths**: Use `filepath.Join` and `filepath.Separator`
- **Home directory**: Use `os.UserHomeDir()` for `~/.git-master`
- **Directory creation**: Always use `os.MkdirAll` with appropriate permissions
- **Atomic operations**: Write to temp file, sync, then rename
- **Lock cleanup**: Use defer for guaranteed lock release

#### Concurrency Safety
- **Lock file timeout**: 3 seconds with 50ms polling
- **Last-write-wins**: Accept that multiple instances may conflict
- **Merge on conflict**: Union of path sets, prefer latest `updatedAt`
- **Non-blocking warnings**: Don't prevent operation on lock timeout

### Frontend-Specific Considerations

#### React Best Practices
- **Full descriptive variable names**: `selectedChangelistGroupId` not `selGroupId`
- **Extract magic numbers**: `const maxGroupNameLength = 100`
- **Component size limits**: Keep components under 500 lines
- **TypeScript strict mode**: Enable all strict type checking
- **SOLID principles**: Single responsibility per component
- **KISS/YAGNI**: Build exactly what's specified, no extras

#### State Management Strategy
- **Zustand patterns**: Use curried syntax for TypeScript
- **No persistence middleware**: Backend handles all persistence
- **Optimistic updates**: Update UI immediately, rollback on error
- **Derived state**: Use selectors for computed values
- **Action composition**: Compose complex actions from simple ones

#### Performance Optimization
- **Virtualization**: Use `@tanstack/react-virtual` for lists >50 items
- **Lazy diff loading**: Fetch diffs only when file is selected
- **Debounced updates**: Debounce Git status polling (500ms)
- **Memoization**: Use `useMemo` for expensive computations
- **Code splitting**: Lazy load Archives view

#### UI/UX Patterns
- **Context menus**: Use Radix UI for cross-platform consistency
- **Keyboard shortcuts**: Standard shortcuts (Cmd/Ctrl+S for commit, etc.)
- **Loading states**: Show spinners for operations >200ms
- **Error boundaries**: Wrap each major section
- **Toast notifications**: Use react-hot-toast for feedback

#### Accessibility
- **Keyboard navigation**: Full keyboard support for all actions
- **Screen reader support**: Proper ARIA labels
- **Focus management**: Restore focus after dialogs
- **Contrast ratios**: WCAG AA compliance minimum

### Integration Considerations

#### Wails Integration
- **Service binding**: Expose services via `GetChangelistService()`
- **Error propagation**: Return errors from Go, handle in TypeScript
- **Type generation**: Ensure struct tags match TypeScript interfaces
- **Event system**: Use Wails events for Git status changes
- **Dialog integration**: Use `runtime.OpenDirectoryDialog` for path selection

#### Existing Component Reuse
- **DiffViewer**: Reuse existing unified/split diff components
- **FileTree**: Extend existing staging file tree component
- **Button/Dialog**: Use existing common components
- **Icons**: Use Lucide React icons consistently
- **Styling**: Follow existing Tailwind patterns

### Edge Cases and Error Handling

#### Git State Edge Cases
- **Empty repository**: Disable operations requiring commits
- **Detached HEAD**: Allow all operations normally
- **Merge in progress**: Show warning, disable conflicting operations
- **Rebase in progress**: Show warning, disable conflicting operations
- **Large files (>10MB)**: Warn user, provide streaming option

#### File System Edge Cases
- **Renamed files**: Update path mappings automatically
- **Deleted files**: Mark as missing, keep in group
- **Binary files**: Use `--binary` flag, show "Binary file" in UI
- **Conflicted files**: Mark with indicator, enable conflict tools
- **Untracked files**: Generate diffs using `--no-index`

#### Concurrent Access Handling
- **Lock acquisition failure**: Show non-blocking warning, continue
- **External Git operations**: Detect via fsnotify, auto-refresh
- **File system changes**: Debounce, batch updates
- **Multiple app instances**: Last-write-wins with merge

#### Error Recovery Strategies
- **Failed archive creation**: Clean up partial files, show error
- **Failed restore**: Keep backup stash, provide rollback option
- **Persistence failures**: Keep in-memory state, mark dirty, retry
- **Git command failures**: Parse stderr, show actionable message

### Security Considerations

#### Path Safety
- **Path traversal prevention**: Validate all paths are within repository
- **Archive name sanitization**: Remove dangerous characters
- **Symlink handling**: Resolve symlinks before operations
- **Hidden file handling**: Allow but warn for sensitive files

#### Command Injection Prevention
- **No shell execution**: Use `exec.Command` with explicit args
- **Path escaping**: Properly escape all user-provided paths
- **Input validation**: Validate all user inputs before Git operations

#### Data Protection
- **Backup before restore**: Optional but recommended
- **Atomic operations**: No partial state on failure
- **Confirmation for destructive actions**: Require explicit confirmation
- **Archive permissions**: Set restrictive permissions (0644)

### Performance Targets

#### Backend Performance
- **JSON load**: <50ms for 1000 files
- **JSON save**: <100ms with lock acquisition
- **Archive creation**: <5s for 100 files
- **Archive restoration**: <3s for 100 files
- **Diff generation**: <500ms per file

#### Frontend Performance
- **Initial render**: <200ms for 50 groups
- **Group expand**: <100ms for 100 files
- **File selection**: <50ms diff loading start
- **State update**: <16ms (60fps)
- **Large lists**: Smooth scrolling with virtualization

#### Memory Targets
- **Backend memory**: <100MB for 10,000 files
- **Frontend memory**: <50MB for active store data
- **Diff caching**: Max 10MB cached diffs
- **Cleanup**: Clear old diffs on tab switch

## Risk Mitigation

### Technical Risks

**Risk**: Data loss due to failed persistence
**Mitigation**: Atomic writes, lock files, backup stash before destructive operations

**Risk**: Performance degradation with large repositories
**Mitigation**: Virtualization, lazy loading, caching, batch operations

**Risk**: Git state inconsistencies
**Mitigation**: Always derive from Git status, auto-reconciliation, refresh on events

**Risk**: Archive corruption
**Mitigation**: Preflight checks, metadata validation, safe rollback

**Risk**: Cross-platform path issues
**Mitigation**: Use Go `filepath` package, normalize to POSIX in storage, test on all platforms

### User Experience Risks

**Risk**: Confusion about tracked vs custom groups
**Mitigation**: Clear visual distinction, tooltips, help documentation

**Risk**: Accidental data loss
**Mitigation**: Confirmation dialogs for destructive actions, trash integration, backup options

**Risk**: Slow operations blocking UI
**Mitigation**: Loading states, progress indicators, cancellation support

**Risk**: Complex context menus
**Mitigation**: Logical grouping, icons, keyboard shortcuts, progressive disclosure

### Integration Risks

**Risk**: Breaking existing staging functionality
**Mitigation**: Extend not replace, keep stagingStore unchanged, comprehensive testing

**Risk**: Wails binding issues
**Mitigation**: Match TypeScript interfaces to Go structs, test all RPC calls, error handling

**Risk**: File watching performance impact
**Mitigation**: Debouncing, selective watching, disable on demand

## Dependencies and Prerequisites

### External Dependencies
- Git 2.25+ installed on user system
- Wails v2.10.2 (already present)
- Go 1.23 (already present)
- Node.js and npm (already present)

### Internal Dependencies
- Existing `stagingService` for Git operations
- Existing `commitService` for commit operations
- Existing diff viewer components
- Existing file tree components
- Existing Zustand store patterns

### Development Prerequisites
- Understanding of Git internals (index, working tree, diff format)
- Familiarity with Wails architecture
- React and Zustand experience
- Go concurrent programming knowledge

## Success Criteria

### Functional Success
- [ ] All acceptance criteria from PRD are met
- [ ] All context menu actions work correctly
- [ ] Archives can be created and restored successfully
- [ ] Custom groups persist and survive app restarts
- [ ] No data loss under any circumstance

### Performance Success
- [ ] All performance targets met
- [ ] Smooth UI with no jank
- [ ] Fast operations even with large repositories
- [ ] Memory usage within targets

### Quality Success
- [ ] >80% code coverage on backend services
- [ ] >70% code coverage on frontend stores
- [ ] All edge cases handled gracefully
- [ ] Comprehensive error messages

### User Experience Success
- [ ] Intuitive UI requiring no documentation
- [ ] Clear visual feedback for all actions
- [ ] Responsive UI with appropriate loading states
- [ ] Helpful error messages with recovery suggestions
