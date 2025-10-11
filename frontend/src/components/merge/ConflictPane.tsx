import { CheckCircle, Info } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/common/Button';

interface ConflictPaneProps {
  title: string;
  content: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onAccept?: () => void;
  helpText?: string;
}

export function ConflictPane({
  title,
  content,
  readOnly = false,
  onChange,
  onAccept,
  helpText,
}: ConflictPaneProps) {
  // Detect language from file extension (simple heuristic)
  const detectLanguage = (content: string): string => {
    // Try to detect language from content patterns
    if (content.includes('import ') || content.includes('export ')) {
      if (content.includes('interface ') || content.includes(': ')) {
        return 'typescript';
      }
      return 'javascript';
    }
    if (content.includes('def ') || content.includes('import ')) {
      return 'python';
    }
    if (content.includes('package ') || content.includes('func ')) {
      return 'go';
    }
    if (content.includes('class ') || content.includes('public ')) {
      return 'java';
    }
    return 'text';
  };

  const language = detectLanguage(content);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Pane header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {onAccept && !readOnly && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAccept}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Accept This Version
            </Button>
          )}
        </div>
        {helpText && (
          <div className="flex items-start gap-2 mt-2 text-xs text-gray-600">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{helpText}</p>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {readOnly || !onChange ? (
          <div className="h-full">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                height: '100%',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
              showLineNumbers
              wrapLines
              lineNumberStyle={{
                minWidth: '3em',
                paddingRight: '1em',
                color: '#6e7681',
                userSelect: 'none',
              }}
            >
              {content || '// Empty'}
            </SyntaxHighlighter>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 border-none"
            style={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              lineHeight: '1.5',
            }}
            placeholder="Enter your custom resolution here..."
            spellCheck={false}
          />
        )}
      </div>

      {/* Footer with metadata */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              Language: <span className="font-medium text-gray-900">{language}</span>
            </span>
            <span>
              Lines: <span className="font-medium text-gray-900">{content.split('\n').length}</span>
            </span>
            <span>
              Characters: <span className="font-medium text-gray-900">{content.length}</span>
            </span>
          </div>
          {!readOnly && onChange && (
            <span className="text-gray-500">{readOnly ? 'Read-only' : 'Editable'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
