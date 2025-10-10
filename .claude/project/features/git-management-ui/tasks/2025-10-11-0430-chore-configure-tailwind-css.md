# Configure Tailwind CSS

## Type
chore

## Description
Set up Tailwind CSS configuration with custom theme colors for Git operations (added, removed, modified), configure content paths for tree shaking, and integrate Tailwind into the application's main CSS file.

## Acceptance Criteria
- [ ] `tailwind.config.js` configured with custom colors
- [ ] Content paths include all TypeScript/TSX files
- [ ] Tailwind directives added to main CSS file
- [ ] Custom monospace font family configured
- [ ] Tailwind utilities work in components (test with `className="bg-primary"`)
- [ ] PostCSS configuration is correct
- [ ] Production build removes unused CSS (tree shaking works)

## Technical Details
- **Files to create/modify**:
  - `frontend/tailwind.config.js`
  - `frontend/postcss.config.js`
  - `frontend/src/index.css` or `frontend/src/App.css`

- **Tailwind config content**:
  ```javascript
  module.exports = {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          added: '#22863a',
          removed: '#cb2431',
          modified: '#f66a0a',
          primary: '#0366d6',
          secondary: '#6f42c1',
          danger: '#d73a49',
          success: '#28a745',
        },
        fontFamily: {
          mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        },
      },
    },
    plugins: [],
  };
  ```

- **Main CSS file** (add to top of `src/index.css`):
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

- **PostCSS config**:
  ```javascript
  module.exports = {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0415-chore-install-frontend-dependencies.md

## Notes
- Custom colors match GitHub's Git operation colors
- JetBrains Mono is optional; falls back to Fira Code, then Consolas
- Tailwind JIT mode is enabled by default in v3
- Consider adding dark mode configuration in future phase
