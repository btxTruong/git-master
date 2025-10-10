/**
 * Detects the programming language based on file extension
 * @param filePath - The file path to detect language from
 * @returns The Prism language identifier
 */
export function detectLanguage(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    mjs: 'javascript',
    cjs: 'javascript',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',

    // Python
    py: 'python',
    pyw: 'python',

    // Java/JVM
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    scala: 'scala',
    groovy: 'groovy',

    // C family
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',

    // Go
    go: 'go',

    // Rust
    rs: 'rust',

    // Ruby
    rb: 'ruby',
    erb: 'erb',

    // PHP
    php: 'php',
    phtml: 'php',

    // Shell
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'bash',

    // Markup
    xml: 'xml',
    svg: 'xml',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    md: 'markdown',
    markdown: 'markdown',

    // SQL
    sql: 'sql',

    // Other
    vim: 'vim',
    dockerfile: 'docker',
    makefile: 'makefile',
    graphql: 'graphql',
    gql: 'graphql',
  };

  // Check filename patterns
  const filename = filePath.split('/').pop()?.toLowerCase() || '';
  if (filename === 'dockerfile') return 'docker';
  if (filename === 'makefile') return 'makefile';
  if (filename === 'cmakelists.txt') return 'cmake';

  return languageMap[extension] || 'text';
}
