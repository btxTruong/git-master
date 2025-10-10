# Install Syntax Highlighting Dependencies

## Type
chore

## Description
Install react-syntax-highlighter and Prism themes for displaying code diffs with syntax highlighting across 200+ programming languages. Configure lazy loading for optimal performance.

## Acceptance Criteria
- [x] react-syntax-highlighter installed (version 15.x+)
- [x] Prism syntax highlighter styles imported
- [x] Test component renders highlighted code correctly
- [x] Types from @types/react-syntax-highlighter installed
- [x] Package.json updated with new dependencies
- [x] Dev server runs without errors after installation

## Technical Details
- **Installation command**:
  ```bash
  cd frontend
  npm install react-syntax-highlighter
  npm install --save-dev @types/react-syntax-highlighter
  ```

- **Test component** (create in components/diff/):
  ```typescript
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
  import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

  export function TestHighlighter() {
    const code = `function hello() {\n  console.log("Hello World");\n}`;

    return (
      <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
        {code}
      </SyntaxHighlighter>
    );
  }
  ```

## Estimated Time
30 minutes

## Dependencies
- Depends on: 2025-10-11-0415-chore-install-frontend-dependencies.md

## Notes
- Use Prism over Highlight.js for better TypeScript support
- vscDarkPlus theme provides VS Code-like appearance
- Consider lazy loading for performance (use React.lazy)
- Supports 200+ languages out of the box
