# Install Frontend Dependencies

## Type
chore

## Description
Install all required npm packages for the React frontend, including state management, routing, UI libraries, styling tools, and specialized libraries for syntax highlighting and virtualization.

## Acceptance Criteria
- [ ] All dependencies installed without errors
- [ ] package.json includes all required packages with correct versions
- [ ] package-lock.json is generated
- [ ] `npm run dev` (Vite dev server) starts successfully
- [ ] TypeScript types are available for all packages
- [ ] No peer dependency warnings

## Technical Details
- **Packages to install**:
  ```bash
  cd frontend

  # State management & routing
  npm install zustand@^4.4.0 react-router-dom@^6.20.0

  # UI components & styling
  npm install @headlessui/react@^1.7.0 @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-select
  npm install lucide-react@^0.300.0
  npm install -D tailwindcss@^3.4.0 postcss autoprefixer

  # Code highlighting & virtualization
  npm install react-syntax-highlighter@^15.5.0
  npm install @types/react-syntax-highlighter -D
  npm install @tanstack/react-virtual@^3.0.0

  # Utilities
  npm install date-fns@^3.0.0
  npm install react-hook-form@^7.49.0
  npm install react-hot-toast@^2.4.0

  # Initialize Tailwind
  npx tailwindcss init -p
  ```

- **Files to modify**:
  - `frontend/package.json`
  - Create `frontend/tailwind.config.js`
  - Create `frontend/postcss.config.js`

- **Verify installation**:
  ```bash
  npm list --depth=0
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0400-chore-initialize-wails-project.md

## Notes
- Use exact versions to ensure consistency across environments
- Some packages require peer dependencies (React 18+)
- @headlessui/react and @radix-ui packages work together, no conflicts
- Consider using `npm ci` in CI/CD for reproducible builds
