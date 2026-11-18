import { render, screen } from '@testing-library/angular';

import { CodeBlock } from './code-block';

describe('CodeBlock', () => {
  it('shows the file, numbered highlighted lines and a copy button', async () => {
    const { container } = await render(CodeBlock, {
      inputs: { code: 'const a = 1;\nexport default a;', filename: 'hero.ts' },
    });
    const region = screen.getByRole('region', { name: 'hero.ts' });
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(container.querySelectorAll('.fm-code__line')).toHaveLength(2);
    expect(container.querySelector('.fm-code__num')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.tok-keyword')?.textContent).toBe('const');
    expect(screen.getByText('hero.ts', { selector: '.fm-window__title' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy hero.ts' })).toBeTruthy();
    expect(region.textContent).toContain('export default a;');
  });

  it('can hide line numbers', async () => {
    const { container } = await render(CodeBlock, {
      inputs: { code: 'ls', language: 'bash', lineNumbers: false },
    });
    expect(container.querySelector('.fm-code__num')).toBeNull();
    expect(screen.getByRole('region', { name: 'bash code' })).toBeTruthy();
  });
});
