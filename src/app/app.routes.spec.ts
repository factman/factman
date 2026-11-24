import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CoreModule } from '@core';

import { routes } from './app.routes';

describe('routes (PRD §4 site map)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      ],
    }),
  );

  const visit = async (url: string) => {
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement as HTMLElement;
    return {
      h1: el.querySelector('h1')?.textContent?.trim(),
      title: TestBed.inject(Title).getTitle(),
    };
  };

  it.each([
    ['/', 'Odunayo Mohammed', 'Odunayo Mohammed'],
    ['/services', 'Senior help for the work that matters most', 'Services · Odunayo Mohammed'],
    ['/services/devops', 'DevOps', 'DevOps · Odunayo Mohammed'],
    ['/projects', 'Projects', 'Projects · Odunayo Mohammed'],
    ['/projects/graphui', 'GraphUI', 'GraphUI · Odunayo Mohammed'],
    ['/blog', 'Blog', 'Blog · Odunayo Mohammed'],
    ['/privacy', 'Privacy and cookies', 'Privacy · Odunayo Mohammed'],
    ['/404', 'command not found', 'Page not found · Odunayo Mohammed'],
    ['/no/such/page', 'command not found', 'Page not found · Odunayo Mohammed'],
    ['/services/no-such-service', 'command not found', 'Page not found · Odunayo Mohammed'],
    ['/projects/no-such-project', 'command not found', 'Page not found · Odunayo Mohammed'],
  ])('%s renders "%s"', async (url, h1, title) => {
    expect(await visit(url)).toEqual({ h1, title });
  });

  /** The head SeoService wrote for `url`. */
  /** One harness per test (RouterTestingHarness allows no more); head() navigates it. */
  let harness: RouterTestingHarness | undefined;
  beforeEach(() => (harness = undefined));
  const head = async (url: string) => {
    harness ??= await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const meta = TestBed.inject(Meta);
    return {
      description: meta.getTag('name="description"')?.content,
      robots: meta.getTag('name="robots"')?.content,
      ogTitle: meta.getTag('property="og:title"')?.content,
      ogType: meta.getTag('property="og:type"')?.content,
      ogUrl: meta.getTag('property="og:url"')?.content,
      canonical: TestBed.inject(DOCUMENT)
        .head.querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    };
  };

  it('gives every page its own description, and canonical URL on www.factman.dev', async () => {
    const pages = [
      '/',
      '/services',
      '/services/devops',
      '/projects',
      '/projects/graphui',
      '/blog',
      '/privacy',
    ];
    const descriptions = new Set<string | undefined>();
    for (const url of pages) {
      const tags = await head(url);
      descriptions.add(tags.description);
      expect(tags.description?.length).toBeGreaterThanOrEqual(50);
      expect(tags.description?.length).toBeLessThanOrEqual(160);
      expect(tags.canonical).toBe(`https://www.factman.dev${url}`);
      expect(tags.ogUrl).toBe(tags.canonical);
    }
    expect(descriptions.size).toBe(pages.length);
  });

  it('derives detail pages from their data', async () => {
    expect(await head('/services/devops')).toMatchObject({
      description: 'CI/CD pipelines and containers so your team ships safely every day.',
      ogTitle: 'DevOps · Odunayo Mohammed',
      ogType: 'article',
    });
    expect(await head('/projects/graphui')).toMatchObject({
      ogTitle: 'GraphUI · Odunayo Mohammed',
      ogType: 'article',
    });
  });

  it.each(['/404', '/no/such/page', '/projects/no-such-project'])(
    '%s is noindex, with no canonical URL',
    async (url) => {
      const tags = await head(url);
      expect(tags.robots).toBe('noindex');
      expect(tags.canonical).toBeUndefined();
    },
  );

  it('restores the site robots and the canonical URL after the not-found page', async () => {
    await head('/404');
    expect(await head('/blog')).toMatchObject({
      robots: 'noindex',
      canonical: 'https://www.factman.dev/blog',
    });
  });
});
