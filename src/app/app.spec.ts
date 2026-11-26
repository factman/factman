import { ViewportScroller } from '@angular/common';
import { importProvidersFrom } from '@angular/core';
import { DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoreModule } from '@core';
import { TERMINAL_ENABLED, TerminalLauncher } from '@shared';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // The consent banner reads ConsentService (CoreModule).
      providers: [
        provideRouter([]),
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      ],
    }).compileComponents();
  });

  it('creates the root component with a main landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('main#main')).not.toBeNull();
  });

  it('frames every page with the site header and footer (MainLayout)', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    // The footer is deferred until it is in view (prerendered pages have it already).
    for (const block of await fixture.getDeferBlocks())
      await block.render(DeferBlockState.Complete);
    const el = fixture.nativeElement as HTMLElement;
    const site = el.querySelector('fm-main-layout .site')!;
    expect(site.querySelectorAll('fm-site-header')).toHaveLength(1);
    expect(site.querySelectorAll('fm-site-footer')).toHaveLength(1);
    // Header, then <main>, then footer, with one <main> on the page.
    const order = [...site.querySelectorAll('fm-site-header, main, fm-site-footer')].map((n) =>
      n.tagName.toLowerCase(),
    );
    expect(order).toEqual(['fm-site-header', 'main', 'fm-site-footer']);
    expect(el.querySelectorAll('main')).toHaveLength(1);
  });
});

describe('App focus management', () => {
  const setup = async () => {
    // jsdom does not implement scrolling.
    Element.prototype.scrollIntoView ??= vi.fn();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      ],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    document.body.appendChild(fixture.nativeElement);
    return { app: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  };

  it('the skip link focuses <main> without navigating', async () => {
    const { el } = await setup();
    const link = el.querySelector<HTMLAnchorElement>('a.skip-link')!;
    const event = new MouseEvent('click', { cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('main'));
  });

  it('focuses <main> after a navigation, or the fragment target when there is one', async () => {
    const { app, el } = await setup();
    const main = el.querySelector('main')!;
    const target = document.createElement('section');
    target.id = 'contact';
    main.appendChild(target);

    app.focusAfterNavigation('/services');
    expect(document.activeElement).toBe(main);

    app.focusAfterNavigation('/#contact');
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute('tabindex')).toBe('-1');
  });

  it('jumps to the fragment of a deep link, and does nothing without one', async () => {
    const { app } = await setup();
    const scrollToAnchor = vi
      .spyOn(TestBed.inject(ViewportScroller), 'scrollToAnchor')
      .mockImplementation(() => undefined);
    app.scrollToFragment('/#contact');
    expect(scrollToAnchor).toHaveBeenCalledWith('contact', { behavior: 'instant' });
    app.scrollToFragment('/services');
    expect(scrollToAnchor).toHaveBeenCalledOnce();
  });
});

describe('App terminal shortcut (FR-36)', () => {
  const setup = async (enabled: boolean) => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        // The terminal's commands read the theme (ThemeService comes with CoreModule).
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
        { provide: TERMINAL_ENABLED, useValue: enabled },
      ],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return { fixture, launcher: TestBed.inject(TerminalLauncher) };
  };
  const press = (init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { key: 'k', cancelable: true, ...init });
    document.dispatchEvent(event);
    return event;
  };

  it('toggles the terminal with Ctrl+K or Cmd+K, and loads it the first time', async () => {
    const { fixture, launcher } = await setup(true);
    expect(press({ ctrlKey: true }).defaultPrevented).toBe(true);
    expect(launcher.open()).toBe(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('fm-terminal-host')).not.toBeNull();
    press({ metaKey: true });
    expect(launcher.open()).toBe(false);
  });

  it('leaves other keys alone, and does nothing while the terminal is off', async () => {
    const { launcher } = await setup(false);
    expect(press({ ctrlKey: true }).defaultPrevented).toBe(false);
    expect(launcher.requested()).toBe(false);
  });

  it('ignores K without Ctrl or Cmd, or with Shift', async () => {
    const { launcher } = await setup(true);
    press({});
    press({ ctrlKey: true, shiftKey: true });
    expect(launcher.requested()).toBe(false);
  });
});
