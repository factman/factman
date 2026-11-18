import { render, screen } from '@testing-library/angular';

import { COUNT_DURATION, countAt, easeOutQuart } from './count-up';
import { StatCounter } from './stat-counter';

describe('count-up', () => {
  it('eases out from 0 to the value', () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
    expect(countAt(40, 0, COUNT_DURATION)).toBe(0);
    expect(countAt(40, COUNT_DURATION / 2, COUNT_DURATION)).toBe(38);
    expect(countAt(40, COUNT_DURATION * 2, COUNT_DURATION)).toBe(40);
  });
});

describe('StatCounter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the final value and reads it to assistive tech', async () => {
    const { container } = await render(StatCounter, {
      inputs: { value: 12, suffix: '+', label: 'years building software' },
    });
    expect(screen.getByText('12+ years building software').classList).toContain('fm-sr');
    expect(container.querySelector('.stat-counter-value')?.textContent).toBe('12+');
    expect(container.querySelector('.stat-counter-value')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('counts up from 0 when it scrolls into view', async () => {
    let fire: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof fire) {
          fire = cb;
        }
        observe() {
          // The test fires the callback itself.
        }
        disconnect() {
          // Nothing to clean up.
        }
      },
    );
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const { container, fixture } = await render(StatCounter, {
      inputs: { value: 40, label: 'projects', framed: true },
    });
    const value = () => container.querySelector('.stat-counter-value')?.textContent;
    expect(value()).toBe('40');
    fire([{ isIntersecting: true }]);
    fixture.detectChanges();
    expect(value()).toBe('0');
    // Angular's scheduler queues frames too; run them all.
    frames.splice(0).forEach((cb) => cb(Number.MAX_SAFE_INTEGER));
    fixture.detectChanges();
    expect(value()).toBe('40');
    expect(container.querySelector('.stat-counter')?.classList).toContain('is-framed');
  });
});
