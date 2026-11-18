import { render } from '@testing-library/angular';

import { Caret } from './caret';

describe('Caret', () => {
  it('is a decorative bar by default', async () => {
    const { container } = await render(Caret);
    const caret = container.querySelector('.fm-caret') as HTMLElement;
    expect(caret.classList).toContain('is-bar');
    expect(caret.getAttribute('aria-hidden')).toBe('true');
  });

  it('can be a block', async () => {
    const { container } = await render(Caret, { inputs: { shape: 'block' } });
    expect(container.querySelector('.is-block')).toBeTruthy();
  });
});
