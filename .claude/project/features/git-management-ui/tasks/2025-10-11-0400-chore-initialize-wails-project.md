# Initialize Wails Project with React TypeScript Template

## Type
chore

## Description
Initialize a new Wails v2 project using the React TypeScript template. This sets up the complete project structure with Go backend and React frontend, including build configuration, development tooling, and basic project scaffolding.

## Acceptance Criteria
- [ ] Wails CLI is installed (v2.x)
- [ ] New project created with command: `wails init -n git-master -t react-ts`
- [ ] Project structure includes `backend/` and `frontend/` directories
- [ ] `wails dev` command launches application successfully
- [ ] Default React app renders in application window
- [ ] Hot reload works for both frontend and backend changes
- [ ] Build command `wails build` produces executable

## Technical Details
- **Commands to run**:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  wails init -n git-master -t react-ts
  cd git-master
  wails dev
  ```

- **Expected directory structure**:
  ```
  git-master/
  ├── main.go
  ├── go.mod
  ├── go.sum
  ├── wails.json
  ├── build/
  ├── backend/
  │   └── app.go
  └── frontend/
      ├── package.json
      ├── vite.config.ts
      └── src/
  ```

- **Dependencies**:
  - Go 1.21+
  - Node.js 18+
  - Wails v2

## Estimated Time
1 hour

## Dependencies
- None (initial setup task)

## Notes
- Ensure system meets Wails prerequisites (https://wails.io/docs/gettingstarted/installation)
- macOS may require Xcode Command Line Tools
- Windows requires WebView2 runtime
- Linux requires gtk3 and webkit2gtk development packages
