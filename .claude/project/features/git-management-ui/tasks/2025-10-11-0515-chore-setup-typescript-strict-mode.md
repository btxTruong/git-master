# Setup TypeScript Strict Mode

## Type
chore

## Description
Configure TypeScript with strict mode enabled to maximize type safety. Update `tsconfig.json` with strict compiler options, path aliases for cleaner imports, and appropriate module resolution settings.

## Acceptance Criteria
- [ ] `strict: true` enabled in `tsconfig.json`
- [ ] Path aliases configured for `@/` pointing to `src/`
- [ ] All strict-related flags explicitly enabled
- [ ] `skipLibCheck: true` to avoid third-party type errors
- [ ] Build completes without TypeScript errors
- [ ] Import aliases work (e.g., `import { Button } from '@/components/common/Button'`)

## Technical Details
- **File to modify**: `frontend/tsconfig.json`

- **TypeScript configuration**:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,

      /* Bundler mode */
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",

      /* Strict Type Checking */
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "strictPropertyInitialization": true,
      "noImplicitThis": true,
      "alwaysStrict": true,

      /* Path Aliases */
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  }
  ```

- **Update Vite config** (`vite.config.ts`) to support path aliases:
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  });
  ```

## Estimated Time
0.5 hours

## Dependencies
- Depends on: 2025-10-11-0400-chore-initialize-wails-project.md

## Notes
- Strict mode may reveal existing type errors in template code; fix them
- Path aliases improve import readability: `@/components/Button` vs `../../../components/Button`
- `skipLibCheck` prevents errors from third-party libraries with incomplete types
- Consider adding `noUncheckedIndexedAccess: true` for extra safety (may be too strict)
