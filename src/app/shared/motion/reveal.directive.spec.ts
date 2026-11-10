import { Component } from '@angular/core';
import { render } from '@testing-library/angular';

import { prefersReducedMotion } from './reduced-motion';
import { Reveal } from './reveal.directive';

@Component({
  imports: [Reveal],
  template: `<section fmReveal [fmRevealDelay]="120">Content</section>`,
})
class Host {}

describe('prefersReducedMotion', () => {
  it('reads the media query, and is false without matchMedia (server, old browsers)', () => {
    const win = (matches: boolean) => ({ matchMedia: () => ({ matches }) }) as unknown as Window;
    expect(prefersReducedMotion(win(true))).toBe(true);
    expect(prefersReducedMotion(win(false))).toBe(false);
    expect(prefersReducedMotion({} as Window)).toBe(false);
    expect(prefersReducedMotion(undefined)).toBe(false);
  });
});

describe('Reveal', () => {
  let callback: IntersectionObserverCallback | undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();

  const setup = async ({ reduced = false, top = 2000 } = {}) => {
    callback = undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (this: unknown, cb: IntersectionObserverCallback) {
        callback = cb;
        return { observe, disconnect };
      }),
    );
    vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top,
      bottom: top + 100,
    } as DOMRect);
    const { container, fixture } = await render(Host);
    await fixture.whenStable();
    return container.querySelector('section')!;
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('hides an element below the fold and reveals it when it scrolls into view', async () => {
    const section = await setup();
    expect(section.classList).toContain('fm-reveal');
    expect(section.classList).not.toContain('is-in');
    expect(section.style.transitionDelay).toBe('120ms');

    callback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(section.classList).toContain('is-in');
    expect(disconnect).toHaveBeenCalled();
  });

  it('never hides an element that is on screen at load', async () => {
    const section = await setup({ top: 100 });
    expect(section.classList).not.toContain('fm-reveal');
  });

  it('never hides anything with reduced motion', async () => {
    const section = await setup({ reduced: true });
    expect(section.classList).not.toContain('fm-reveal');
    expect(callback).toBeUndefined();
  });
});
