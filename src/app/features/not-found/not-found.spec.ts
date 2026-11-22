import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { NotFoundPage } from './not-found';

describe('NotFoundPage', () => {
  /** Renders the page at `path`, as the browser's address (resolvers keep it). */
  const setup = (path: string) => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideLocationMocks()] });
    if (path) TestBed.inject(Location).go(path);
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const linkHref = (el: HTMLElement, name: string) =>
    [...el.querySelectorAll('a')].find((a) => a.textContent?.trim() === name)?.getAttribute('href');

  it('shows the address that was not found, and is never indexed', () => {
    const el = setup('/projects/does-not-exist');
    expect(el.textContent).toContain('cd /projects/does-not-exist');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex');
  });

  it('offers home, Projects, Services and Blog, with the thinking portrait', () => {
    const el = setup('/nowhere');
    expect(linkHref(el, 'Go home')).toBe('/');
    expect(linkHref(el, 'Projects')).toBe('/projects');
    expect(linkHref(el, 'Services')).toBe('/services');
    expect(linkHref(el, 'Blog')).toBe('/blog');
    expect(el.querySelector('img')?.getAttribute('alt')).toMatch(/thinking pose/);
  });

  it('falls back to /404 when the address is empty', () => {
    expect(setup('').textContent).toContain('cd /404');
  });
});
