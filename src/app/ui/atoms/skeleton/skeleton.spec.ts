import { render } from '@testing-library/angular';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is a hidden line by default', async () => {
    const { container } = await render(Skeleton);
    const el = container.querySelector('.fm-skel') as HTMLElement;
    expect(el.className).toBe('fm-skel');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes a shape and a size', async () => {
    const { container } = await render(Skeleton, {
      inputs: { shape: 'rect', width: '100%', height: '12rem' },
    });
    const el = container.querySelector('.fm-skel') as HTMLElement;
    expect(el.classList).toContain('fm-skel--rectangle');
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('12rem');
  });
});
