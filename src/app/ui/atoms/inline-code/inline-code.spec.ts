import { render, screen } from '@testing-library/angular';

import { InlineCode } from './inline-code';

describe('InlineCode', () => {
  it('wraps its content in a code element', async () => {
    await render(`<p>Run <fm-inline-code>pnpm build</fm-inline-code> first.</p>`, {
      imports: [InlineCode],
    });
    const code = screen.getByText('pnpm build');
    expect(code.tagName).toBe('CODE');
    expect(code.classList).toContain('fm-icode');
  });
});
