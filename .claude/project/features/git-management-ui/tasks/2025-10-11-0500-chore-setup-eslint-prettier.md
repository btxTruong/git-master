# Setup ESLint and Prettier

## Type
chore

## Description
Configure ESLint with TypeScript support and Prettier for code formatting. Set up rules based on Airbnb style guide with TypeScript extensions, and ensure both tools work together without conflicts.

## Acceptance Criteria
- [ ] ESLint installed with TypeScript parser and plugins
- [ ] Prettier installed and configured
- [ ] `.eslintrc.json` created with appropriate rules
- [ ] `.prettierrc` created with project formatting standards
- [ ] `.eslintignore` and `.prettierignore` files created
- [ ] `npm run lint` command works and checks all TypeScript files
- [ ] `npm run format` command formats code with Prettier
- [ ] VSCode/IDE integration works (optional but recommended)
- [ ] No conflicts between ESLint and Prettier rules

## Technical Details
- **Packages to install**:
  ```bash
  cd frontend
  npm install -D eslint@^8.55.0 @typescript-eslint/parser @typescript-eslint/eslint-plugin
  npm install -D eslint-plugin-react eslint-plugin-react-hooks
  npm install -D prettier eslint-config-prettier eslint-plugin-prettier
  ```

- **`.eslintrc.json`**:
  ```json
  {
    "parser": "@typescript-eslint/parser",
    "extends": [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],
    "plugins": ["react", "@typescript-eslint", "prettier"],
    "rules": {
      "prettier/prettier": "error",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    },
    "settings": {
      "react": {
        "version": "detect"
      }
    }
  }
  ```

- **`.prettierrc`**:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "arrowParens": "always"
  }
  ```

- **Add npm scripts to `package.json`**:
  ```json
  {
    "scripts": {
      "lint": "eslint . --ext .ts,.tsx",
      "lint:fix": "eslint . --ext .ts,.tsx --fix",
      "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\""
    }
  }
  ```

## Estimated Time
1 hour

## Dependencies
- Depends on: 2025-10-11-0415-chore-install-frontend-dependencies.md

## Notes
- `eslint-config-prettier` disables conflicting ESLint rules
- Consider adding pre-commit hooks with Husky (future enhancement)
- VSCode users should install ESLint and Prettier extensions
- Update `.eslintignore` to exclude `wailsjs/` generated files
