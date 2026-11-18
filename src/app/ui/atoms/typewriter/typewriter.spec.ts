import { render, screen } from '@testing-library/angular';

import { TYPEWRITER_TIMING as T, Typewriter } from './typewriter';

const words = ['Engineer', 'CTO'];

function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce, media: query }));
}

const visible = (container: Element) =>
  container.querySelector('.fm-typewriter__word')?.textContent ?? '';

describe('Typewriter', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reads every word to assistive tech and hides the moving text', async () => {
    stubMotion(true);
    const { container } = await render(Typewriter, { inputs: { words, prefix: "I'm a" } });
    expect(screen.getByText("I'm a Engineer, CTO").classList).toContain('fm-sr');
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toContain('Engineer');
  });

  it('shows the first word only with reduced motion', async () => {
    stubMotion(true);
    vi.useFakeTimers();
    const { container, fixture } = await render(Typewriter, { inputs: { words } });
    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(visible(container)).toBe('Engineer');
  });

  it('holds, erases and types the next word', async () => {
    stubMotion(false);
    vi.useFakeTimers();
    const { container, fixture } = await render(Typewriter, { inputs: { words } });
    const step = async (ms: number) => {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
    };
    expect(visible(container)).toBe('Engineer');
    // The first letter goes as the hold ends, then one every `erase` ms.
    await step(T.hold + T.erase);
    expect(visible(container)).toBe('Engine');
    // Six more letters, one empty tick, the pause, then a letter at once and one after `type`.
    await step(T.erase * 7 + T.pause + T.type);
    expect(visible(container)).toBe('CT');
    await step(T.type);
    expect(visible(container)).toBe('CTO');
  });

  it('stops on the last word without loop', async () => {
    stubMotion(false);
    vi.useFakeTimers();
    const { container, fixture } = await render(Typewriter, { inputs: { words, loop: false } });
    await vi.advanceTimersByTimeAsync(30_000);
    fixture.detectChanges();
    expect(visible(container)).toBe('CTO');
  });
});
