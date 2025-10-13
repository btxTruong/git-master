export function detectLanguageFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    r: 'r',
    m: 'objectivec',
    mm: 'objectivec',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'bash',
    ps1: 'powershell',
    sql: 'sql',
    html: 'html',
    htm: 'html',
    xml: 'xml',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    md: 'markdown',
    markdown: 'markdown',
    tex: 'latex',
    vue: 'vue',
    svelte: 'svelte',
    dart: 'dart',
    lua: 'lua',
    perl: 'perl',
    pl: 'perl',
    hs: 'haskell',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    clj: 'clojure',
    cljs: 'clojure',
    elm: 'elm',
    ml: 'ocaml',
    fs: 'fsharp',
    fsx: 'fsharp',
    vb: 'vbnet',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    graphql: 'graphql',
    gql: 'graphql',
    proto: 'protobuf',
    tf: 'terraform',
    hcl: 'hcl',
  };

  if (extension && languageMap[extension]) {
    return languageMap[extension];
  }

  const baseFilename = filename.toLowerCase();
  if (baseFilename === 'dockerfile' || baseFilename.startsWith('dockerfile.')) {
    return 'dockerfile';
  }
  if (baseFilename === 'makefile' || baseFilename === 'gnumakefile') {
    return 'makefile';
  }
  if (baseFilename === '.gitignore' || baseFilename === '.dockerignore') {
    return 'text';
  }

  return 'text';
}
