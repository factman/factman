import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { SCROLL_SPY_ENABLED, ScrollSpy } from './scroll-spy';

describe('ScrollSpy', () => {
  let fire: (entries: { target: Element; isIntersecting: boolean }[]) => void;
  const observed: Element[] = [];
  let created = 0;
  const location = {
    path: vi.fn(() => '/'),
    getState: vi.fn(() => ({ navigationId: 3 })),
    replaceState: vi.fn(),
  };

  beforeEach(() => {
    observed.length = 0;
    created = 0;
    location.replaceState.mockClear();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof fire) {
          fire = cb;
          created++;
        }
        observe(el: Element) {
          observed.push(el);
        }
        unobserve(el: Element) {
          observed.splice(observed.indexOf(el), 1);
        }
      },
    );
    TestBed.configureTestingModule({ providers: [{ provide: Location, useValue: location }] });
  });
  afterEach(() => vi.unstubAllGlobals());

  const sections = () => {
    const spy = TestBed.inject(ScrollSpy);
    const about = document.createElement('section');
    const work = document.createElement('section');
    const stopAbout = spy.register('about', about);
    const stopWork = spy.register('work', work);
    return { spy, about, work, stopAbout, stopWork };
  };

  it('reports the first section in view, in page order', () => {
    const { spy, about, work, stopWork } = sections();
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

  it('puts the section in view in the URL hash without a new history entry', () => {
    const { about, work } = sections();
    fire([{ target: work, isIntersecting: true }]);
    expect(location.replaceState).toHaveBeenLastCalledWith('/#work', '', { navigationId: 3 });
    fire([{ target: about, isIntersecting: true }]);
    expect(location.replaceState).toHaveBeenLastCalledWith('/#about', '', { navigationId: 3 });
    // The same section again changes nothing.
    fire([{ target: work, isIntersecting: false }]);
    expect(location.replaceState).toHaveBeenCalledTimes(2);
    // Back above the first section: the hash goes.
    fire([{ target: about, isIntersecting: false }]);
    expect(location.replaceState).toHaveBeenLastCalledWith('/', '', { navigationId: 3 });
  });

  it('leaves the URL alone when sections leave the page (a navigation)', () => {
    const { work, stopAbout, stopWork } = sections();
    fire([{ target: work, isIntersecting: true }]);
    location.replaceState.mockClear();
    stopWork();
    stopAbout();
    expect(location.replaceState).not.toHaveBeenCalled();
  });

  it('does nothing while the feature flag is off', () => {
    TestBed.overrideProvider(SCROLL_SPY_ENABLED, { useValue: false });
    const { spy } = sections();
    expect(created).toBe(0);
    expect(observed).toEqual([]);
    expect(spy.active()).toBeUndefined();
    expect(location.replaceState).not.toHaveBeenCalled();
  });
});
