import { lazy, Suspense, useState, useEffect } from 'react';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import type { CSSProperties } from 'react';

const SyntaxHighlighterLazy = lazy(() =>
  import('react-syntax-highlighter').then((module) => ({
    default: module.Prism,
  }))
);

interface SyntaxHighlightProps {
  code: string;
  language: string;
  customStyle?: SyntaxHighlighterProps['customStyle'];
  className?: string;
}

export function SyntaxHighlight({ code, language, customStyle, className }: SyntaxHighlightProps) {
  const [style, setStyle] = useState<{ [key: string]: CSSProperties } | null>(null);

  useEffect(() => {
    // Dynamically import the style
    import('react-syntax-highlighter/dist/esm/styles/prism').then((module) => {
      setStyle(module.vscDarkPlus);
    });
  }, []);

  return (
    <Suspense
      fallback={
        <div className={`animate-pulse bg-gray-100 rounded p-4 ${className}`}>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      }
    >
      {style ? (
        <SyntaxHighlighterLazy
          language={language}
          style={style}
          customStyle={customStyle}
          className={className}
        >
          {code}
        </SyntaxHighlighterLazy>
      ) : (
        <div className={`animate-pulse bg-gray-100 rounded p-4 ${className}`}>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}
    </Suspense>
  );
}
