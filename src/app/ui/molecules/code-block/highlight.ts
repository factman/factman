/**
 * A small syntax highlighter for the snippets on the site (ETE-75). It splits code into tokens
 * with the design system's classes (`tok-keyword`, `tok-string` …, portfolio-code-terminal-ui.css).
 * Enough for short TypeScript, JavaScript, JSON, shell and HTML samples; not a parser.
 */
export type CodeLanguage = 'ts' | 'js' | 'json' | 'bash' | 'html' | 'text';

export type TokenKind =
  'keyword' | 'string' | 'number' | 'function' | 'type' | 'tag' | 'comment' | 'punctuation';

export interface Token {
  text: string;
  kind?: TokenKind;
}

type Rule = [RegExp, TokenKind | ((match: string, rest: string) => TokenKind | undefined)];

// A regex literal, not `new RegExp`, so bundles that never highlight (the home page, whose code
// editor is highlighted at build time, ETE-90) can drop this module.
// prettier-ignore
const word = /(?:abstract|as|async|await|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|private|protected|public|readonly|return|set|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|yield)\b/y;

const TS_RULES: Rule[] = [
  [/\/\/[^\n]*/y, 'comment'],
  [/\/\*[\s\S]*?\*\//y, 'comment'],
  [/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/y, 'string'],
  [/\b\d[\d_]*(?:\.\d+)?\b/y, 'number'],
  [word, 'keyword'],
  [
    /@?[A-Za-z_$][\w$]*/y,
    (m, rest) => {
      // Decorators and capitalised names are types, even when called (`@Component(`).
      if (m.startsWith('@') || /^[A-Z]/.test(m)) return 'type';
      return /^\s*\(/.test(rest) ? 'function' : undefined;
    },
  ],
  [/[{}()[\];,.:=<>+\-*/!?&|]/y, 'punctuation'],
];

// No statements after the table (`RULES.js = …`): an assignment would keep it in every bundle.
const RULES: Record<Exclude<CodeLanguage, 'text'>, Rule[]> = {
  ts: TS_RULES,
  js: TS_RULES,
  json: [
    [/"(?:\\.|[^"\\\n])*"(?=\s*:)/y, 'tag'],
    [/"(?:\\.|[^"\\\n])*"/y, 'string'],
    [/-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y, 'number'],
    [/\b(?:true|false|null)\b/y, 'keyword'],
    [/[{}[\],:]/y, 'punctuation'],
  ],
  bash: [
    [/#[^\n]*/y, 'comment'],
    [/(["'])(?:\\.|(?!\1)[^\\\n])*\1/y, 'string'],
    [/(?<=^|\n|&&\s|\|\s)[\w./-]+/y, 'function'],
    [/--?[\w-]+/y, 'keyword'],
    [/[|&;><=]/y, 'punctuation'],
  ],
  html: [
    [/<!--[\s\S]*?-->/y, 'comment'],
    [/<\/?[\w-]+/y, 'tag'],
    [/\/?>/y, 'tag'],
    [/(["'])(?:(?!\1)[^\n])*\1/y, 'string'],
    [/[\w-:[\]()@.*]+(?==)/y, 'type'],
    [/=/y, 'punctuation'],
  ],
};

/** The code as lines of tokens; text no rule matches comes through as plain tokens. */
export function highlight(code: string, language: CodeLanguage): Token[][] {
  const lines: Token[][] = [[]];
  const push = (text: string, kind?: TokenKind) => {
    const parts = text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (!part) return;
      const line = lines[lines.length - 1];
      const last = line[line.length - 1];
      if (last && !last.kind && !kind) last.text += part;
      else line.push(kind ? { text: part, kind } : { text: part });
    });
  };
  if (language === 'text') {
    push(code);
    return lines;
  }
  const rules = RULES[language];
  let i = 0;
  outer: while (i < code.length) {
    for (const [re, kind] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length) {
        const k = typeof kind === 'function' ? kind(m[0], code.slice(i + m[0].length)) : kind;
        push(m[0], k);
        i += m[0].length;
        continue outer;
      }
    }
    push(code[i]);
    i++;
  }
  return lines;
}
