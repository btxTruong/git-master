# Create Project Folder Structure

## Type
chore

## Description
Create the complete frontend and backend folder structure as defined in the architecture document. This includes directories for components, stores, views, utilities, types, and backend services.

## Acceptance Criteria
- [ ] All frontend directories exist: `api/`, `components/`, `stores/`, `views/`, `hooks/`, `utils/`, `types/`
- [ ] Component subdirectories created: `commit/`, `diff/`, `branch/`, `staging/`, `merge/`, `repository/`, `common/`, `layout/`
- [ ] All backend directories exist: `services/`, `models/`, `git/`
- [ ] Each directory contains a `.gitkeep` or README file (not empty)
- [ ] Directory structure matches architecture document

## Technical Details
- **Commands to run**:
  ```bash
  # Frontend structure
  cd frontend/src
  mkdir -p api components/{commit,diff,branch,staging,merge,repository,common,layout}
  mkdir -p stores views hooks utils types

  # Backend structure
  cd ../../backend
  mkdir -p services models git

  # Create .gitkeep files to track empty directories
  find . -type d -empty -exec touch {}/.gitkeep \;
  ```

- **Expected structure**:
  ```
  frontend/src/
  ├── api/
  ├── components/
  │   ├── commit/
  │   ├── diff/
  │   ├── branch/
  │   ├── staging/
  │   ├── merge/
  │   ├── repository/
  │   ├── common/
  │   └── layout/
  ├── stores/
  ├── views/
  ├── hooks/
  ├── utils/
  └── types/

  backend/
  ├── services/
  ├── models/
  └── git/
  ```

## Estimated Time
0.5 hours

## Dependencies
- Depends on: 2025-10-11-0400-chore-initialize-wails-project.md

## Notes
- Use `.gitkeep` files to ensure empty directories are tracked by Git
- This structure can be extended later as needed
- Consider adding README files to each directory explaining its purpose
