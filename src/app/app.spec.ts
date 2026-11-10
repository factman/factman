import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the root component with a main landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('main#main')).not.toBeNull();
  });
});

describe('App focus management', () => {
  const setup = async () => {
    // jsdom does not implement scrolling.
    Element.prototype.scrollIntoView ??= vi.fn();
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
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
});
