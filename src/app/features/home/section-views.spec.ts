import { watchSectionViews } from './section-views';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

/** A stand-in IntersectionObserver that the test drives by hand. */
class FakeObserver {
  static last: FakeObserver;
  observed = new Set<Element>();
  constructor(readonly callback: Callback) {
    FakeObserver.last = this;
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  fire(target: Element, ratio: number, height: number) {
    this.callback([
      {
        target,
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
        intersectionRect: { height } as DOMRectReadOnly,
      },
    ]);
  }
}

describe('watchSectionViews', () => {
  const original = window.IntersectionObserver;
  let about: HTMLElement;
  let stack: HTMLElement;

  beforeEach(() => {
    window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    document.body.innerHTML = '<section id="about"></section><section id="stack"></section>';
    about = document.getElementById('about')!;
    stack = document.getElementById('stack')!;
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  });

  afterEach(() => {
    window.IntersectionObserver = original;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('reports each section once, when half of it is visible', () => {
    const seen: string[] = [];
    watchSectionViews(document, ['about', 'stack', 'missing'], (id) => seen.push(id));
    const io = FakeObserver.last;
    expect([...io.observed]).toEqual([about, stack]);
    io.fire(about, 0.3, 100);
    expect(seen).toEqual([]);
    io.fire(about, 0.5, 200);
    io.fire(about, 1, 400);
    expect(seen).toEqual(['about']);
    expect(io.observed.has(about)).toBe(false);
  });

  it('counts a section taller than the screen once it fills half the screen', () => {
    const seen: string[] = [];
    watchSectionViews(document, ['stack'], (id) => seen.push(id));
    FakeObserver.last.fire(stack, 0.2, 400);
    expect(seen).toEqual(['stack']);
  });

  it('stops watching when asked, and does nothing without IntersectionObserver', () => {
    const stop = watchSectionViews(document, ['about'], vi.fn());
    stop();
    expect(FakeObserver.last.observed.size).toBe(0);
    window.IntersectionObserver = undefined as never;
    expect(() => watchSectionViews(document, ['about'], vi.fn())()).not.toThrow();
  });
});
