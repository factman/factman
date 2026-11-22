import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AnchorScroller } from './anchor-scroller';

describe('AnchorScroller', () => {
  let target: HTMLElement;

  const scroller = (platform = 'browser') => {
    TestBed.configureTestingModule({
      providers: [AnchorScroller, { provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(AnchorScroller);
  };
  const reducedMotion = (on: boolean) =>
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: on, media: query }));

  beforeEach(() => {
    target = document.createElement('section');
    target.id = 'projects';
    target.tabIndex = -1;
    target.scrollIntoView = vi.fn();
    document.body.append(target);
    reducedMotion(false);
  });
  afterEach(() => {
    target.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('scrolls smoothly to an anchor, keeping its scroll margin, and focuses it', () => {
    scroller().scrollToAnchor('projects');
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
    expect(document.activeElement).toBe(target);
  });

  it('jumps at once with reduced motion', () => {
    reducedMotion(true);
    scroller().scrollToAnchor('projects');
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });

  it('honours the behaviour it is asked for', () => {
    scroller().scrollToAnchor('projects', { behavior: 'instant' });
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });

  it('finds a named anchor, and ignores a missing one', () => {
    const named = document.createElement('a');
    named.setAttribute('name', 'L12');
    named.scrollIntoView = vi.fn();
    document.body.append(named);
    const s = scroller();
    s.scrollToAnchor('L12');
    expect(named.scrollIntoView).toHaveBeenCalled();
    expect(() => s.scrollToAnchor('nowhere')).not.toThrow();
    named.remove();
  });

  it('passes positions and their options to the window', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    scroller().scrollToPosition([0, 120], { behavior: 'instant' });
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'instant', left: 0, top: 120 });
  });

  it('sets the history scroll restoration and reads the position', () => {
    const s = scroller();
    s.setHistoryScrollRestoration('manual');
    expect(history.scrollRestoration).toBe('manual');
    s.setHistoryScrollRestoration('auto');
    expect(s.getScrollPosition()).toEqual([window.scrollX, window.scrollY]);
  });

  it('does nothing on the server', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const s = scroller('server');
    s.scrollToAnchor('projects');
    s.scrollToPosition([0, 10]);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(s.getScrollPosition()).toEqual([0, 0]);
  });
});
