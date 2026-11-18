import { TestBed } from '@angular/core/testing';

import { ScrollSpy } from './scroll-spy';

describe('ScrollSpy', () => {
  let fire: (entries: { target: Element; isIntersecting: boolean }[]) => void;
  const observed: Element[] = [];

  beforeEach(() => {
    observed.length = 0;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof fire) {
          fire = cb;
        }
        observe(el: Element) {
          observed.push(el);
        }
        unobserve(el: Element) {
          observed.splice(observed.indexOf(el), 1);
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reports the first section in view, in page order', () => {
    const spy = TestBed.inject(ScrollSpy);
    const about = document.createElement('section');
    const work = document.createElement('section');
    spy.register('about', about);
    const stopWork = spy.register('work', work);
    expect(observed).toEqual([about, work]);
    expect(spy.active()).toBeUndefined();
    fire([{ target: work, isIntersecting: true }]);
    expect(spy.active()).toBe('work');
    fire([{ target: about, isIntersecting: true }]);
    expect(spy.active()).toBe('about');
    fire([{ target: about, isIntersecting: false }]);
    expect(spy.active()).toBe('work');
    stopWork();
    expect(spy.active()).toBeUndefined();
    expect(observed).toEqual([about]);
  });
});
