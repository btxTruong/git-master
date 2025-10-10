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
