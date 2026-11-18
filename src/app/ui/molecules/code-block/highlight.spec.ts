import { highlight, type Token } from './highlight';

const kinds = (line: Token[]) => line.filter((t) => t.kind).map((t) => `${t.kind}:${t.text}`);

describe('highlight', () => {
  it('colours TypeScript', () => {
    const [line] = highlight("const total = sum(items, 'eur'); // fees", 'ts');
    expect(kinds(line)).toEqual([
      'keyword:const',
      'punctuation:=',
      'function:sum',
      'punctuation:(',
      'punctuation:,',
      "string:'eur'",
      'punctuation:)',
      'punctuation:;',
      'comment:// fees',
    ]);
    expect(line.map((t) => t.text).join('')).toBe("const total = sum(items, 'eur'); // fees");
  });

  it('marks types and decorators, and splits lines', () => {
    const lines = highlight('@Component({})\nexport class Hero {}', 'ts');
    expect(lines).toHaveLength(2);
    expect(kinds(lines[0])).toContain('type:@Component');
    expect(kinds(lines[1])).toEqual([
      'keyword:export',
      'keyword:class',
      'type:Hero',
      'punctuation:{',
      'punctuation:}',
    ]);
  });

  it('tells JSON keys from values', () => {
    const [line] = highlight('{ "years": 12, "remote": true, "city": "Lagos" }', 'json');
    expect(kinds(line)).toEqual([
      'punctuation:{',
      'tag:"years"',
      'punctuation::',
      'number:12',
      'punctuation:,',
      'tag:"remote"',
      'punctuation::',
      'keyword:true',
      'punctuation:,',
      'tag:"city"',
      'punctuation::',
      'string:"Lagos"',
      'punctuation:}',
    ]);
  });

  it('colours shell commands and HTML', () => {
    expect(kinds(highlight('pnpm nx run factman:build --prod # go', 'bash')[0])).toEqual([
      'function:pnpm',
      'keyword:--prod',
      'comment:# go',
    ]);
    expect(kinds(highlight('<a href="/cv">CV</a>', 'html')[0])).toEqual([
      'tag:<a',
      'type:href',
      'punctuation:=',
      'string:"/cv"',
      'tag:>',
      'tag:</a',
      'tag:>',
    ]);
  });

  it('leaves plain text alone', () => {
    expect(highlight('a\nb', 'text')).toEqual([[{ text: 'a' }], [{ text: 'b' }]]);
  });
});
