import { useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import type { InlineDiffSegment } from '@/utils/inlineDiff';

interface SyntaxHighlightedLineProps {
  content: string;
  language: string;
  segments?: InlineDiffSegment[];
  segmentType?: 'delete' | 'insert';
  highlightColor?: string;
}

interface Token {
  type: string;
  content: string | Token[];
  alias?: string | string[];
}

const TOKEN_COLORS: Record<string, string> = {
  comment: '#008000',
  prolog: '#008000',
  doctype: '#008000',
  cdata: '#008000',
  punctuation: '#393A34',
  property: '#001080',
  tag: '#800000',
  boolean: '#0000ff',
  number: '#098658',
  constant: '#0000ff',
  symbol: '#0000ff',
  deleted: '#a31515',
  selector: '#800000',
  'attr-name': '#ff0000',
  string: '#a31515',
  char: '#a31515',
  builtin: '#267f99',
  inserted: '#008000',
  operator: '#000000',
  entity: '#800000',
  url: '#0000ff',
  variable: '#001080',
  atrule: '#af00db',
  'attr-value': '#a31515',
  function: '#795e26',
  'class-name': '#267f99',
  keyword: '#0000ff',
  regex: '#811f3f',
  important: '#0000ff',
  bold: '#000000',
  italic: '#000000',
};

function flattenTokens(tokens: (string | Token)[]): Array<{ type: string; text: string }> {
  const result: Array<{ type: string; text: string }> = [];

  function flatten(token: string | Token | Token[]) {
    if (typeof token === 'string') {
      result.push({ type: 'plain', text: token });
    } else if (Array.isArray(token)) {
      token.forEach(flatten);
    } else if (token && typeof token === 'object' && 'content' in token) {
      if (typeof token.content === 'string') {
        result.push({ type: token.type, text: token.content });
      } else {
        flatten(token.content);
      }
    }
  }

  tokens.forEach(flatten);
  return result;
}

export function SyntaxHighlightedLine({
  content,
  language,
  segments,
  segmentType,
  highlightColor,
}: SyntaxHighlightedLineProps) {
  const tokens = useMemo(() => {
    try {
      const grammar = Prism.languages[language];
      if (!grammar) {
        return [{ type: 'plain', text: content }];
      }

      const prismTokens = Prism.tokenize(content, grammar);
      return flattenTokens(prismTokens as (string | Token)[]);
    } catch (error) {
      return [{ type: 'plain', text: content }];
    }
  }, [content, language]);

  if (segments && segmentType) {
    let currentTokenIndex = 0;
    let currentTokenOffset = 0;
    const result: JSX.Element[] = [];
    let segmentIndex = 0;

    segments.forEach((segment) => {
      const segmentLength = segment.text.length;
      let remaining = segmentLength;
      const segmentParts: JSX.Element[] = [];

      while (remaining > 0 && currentTokenIndex < tokens.length) {
        const token = tokens[currentTokenIndex];
        const availableInToken = token.text.length - currentTokenOffset;

        if (availableInToken <= remaining) {
          const text = token.text.substring(currentTokenOffset);
          const color = TOKEN_COLORS[token.type] || '#000000';

          segmentParts.push(
            <span key={`${currentTokenIndex}-${currentTokenOffset}`} style={{ color }}>
              {text}
            </span>
          );

          remaining -= availableInToken;
          currentTokenIndex++;
          currentTokenOffset = 0;
        } else {
          const text = token.text.substring(currentTokenOffset, currentTokenOffset + remaining);
          const color = TOKEN_COLORS[token.type] || '#000000';

          segmentParts.push(
            <span key={`${currentTokenIndex}-${currentTokenOffset}`} style={{ color }}>
              {text}
            </span>
          );

          currentTokenOffset += remaining;
          remaining = 0;
        }
      }

      const shouldHighlight =
        (segment.type === 'delete' && segmentType === 'delete') ||
        (segment.type === 'insert' && segmentType === 'insert');

      result.push(
        <span
          key={segmentIndex++}
          style={shouldHighlight ? { backgroundColor: highlightColor } : undefined}
        >
          {segmentParts}
        </span>
      );
    });

    return <span className="whitespace-pre">{result}</span>;
  }

  return (
    <span className="whitespace-pre">
      {tokens.map((token, index) => {
        const color = TOKEN_COLORS[token.type] || '#000000';
        return (
          <span key={index} style={{ color }}>
            {token.text}
          </span>
        );
      })}
    </span>
  );
}
