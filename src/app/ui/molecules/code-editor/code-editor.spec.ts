import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { highlight } from '../code-block/highlight';
import { CodeEditor, type EditorFile } from './code-editor';

const PROFILE_TS = `const profile = {
  name: "Odunayo Mohammed",
  role: "Fullstack Software Engineer and CTO",
  base: "Lagos, Nigeria",
  since: 2013,
  stack: ["Angular", "Node.js", "TypeScript"],
};`;

/** The hero's file, highlighted here as scripts/data/generate-hero-code.ts does at build time. */
const profileTs: EditorFile = {
  name: 'profile.ts',
  language: 'ts',
  lines: highlight(PROFILE_TS, 'ts'),
  highlightLines: [6],
};

const readme: EditorFile = {
  name: 'README.md',
  language: 'md',
  lines: [[{ text: '# Odunayo' }]],
};

describe('CodeEditor', () => {
  it('shows the highlighted file with line numbers, the highlighted line and a status bar', async () => {
    const { container } = await render(CodeEditor, { inputs: { files: [profileTs] } });
    const region = screen.getByRole('region', { name: 'profile.ts source' });
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(container.querySelectorAll('.fm-code__line')).toHaveLength(7);
    expect(container.querySelector('.tok-keyword')?.textContent).toBe('const');
    expect(container.querySelector('.fm-code__line.is-hl')?.textContent).toContain('stack:');
    expect(screen.getByText('profile.ts', { selector: '.fm-window__title' })).toBeTruthy();
    const status = container.querySelector('.code-editor-status')?.textContent;
    expect(status).toContain('main');
    expect(status).toContain('Ln 7, Col 3');
    expect(status).toContain('TS');
    expect(screen.getByRole('button', { name: 'Copy profile.ts' })).toBeTruthy();
  });

  it('switches files with the tabs, by click and arrow keys', async () => {
    const { fixture } = await render(CodeEditor, { inputs: { files: [profileTs, readme] } });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['profile.ts', 'README.md']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    await userEvent.click(tabs[1]);
    expect(screen.getByRole('region', { name: 'README.md source' }).textContent).toContain(
      '# Odunayo',
    );
    expect(fixture.componentInstance.activeFile()).toBe(1);
    screen.getAllByRole('tab')[1].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[0]);
  });

  it('is hidden from assistive tech and inert when decorative, so nothing is read twice', async () => {
    const { container } = await render(CodeEditor, {
      inputs: { files: [profileTs], decorative: true },
    });
    const editor = container.querySelector('.code-editor')!;
    expect(editor.getAttribute('aria-hidden')).toBe('true');
    expect(editor.hasAttribute('inert')).toBe(true);
    expect(container.querySelector('pre')?.hasAttribute('tabindex')).toBe(false);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('copies the plain code', async () => {
    const { fixture } = await render(CodeEditor, { inputs: { files: [profileTs] } });
    const code = (fixture.componentInstance as unknown as { code: () => string }).code();
    expect(code.split('\n')[0]).toBe('const profile = {');
    expect(code.endsWith('};')).toBe(true);
  });
});
