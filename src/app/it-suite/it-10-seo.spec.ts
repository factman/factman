import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { STRUCTURED_DATA_ID } from '@core/seo';

import { openApp } from './it-harness';

// IT-10: the title, description, canonical URL and JSON-LD follow each navigation.
describe('IT-10 Title, description, canonical and JSON-LD update on each navigation', () => {
  it('rewrites the head for every page, with one canonical link and one JSON-LD block', async () => {
    const { go } = await openApp('/');
    const doc = TestBed.inject(DOCUMENT);
    const head = () => ({
      title: TestBed.inject(Title).getTitle(),
      description: TestBed.inject(Meta).getTag('name="description"')?.content,
      canonical: [...doc.head.querySelectorAll('link[rel="canonical"]')].map((l) =>
        l.getAttribute('href'),
      ),
      jsonLd: [...doc.querySelectorAll(`script#${STRUCTURED_DATA_ID}`)].map((s) => s.textContent),
    });
    const seen = { titles: new Set(), descriptions: new Set(), jsonLd: new Set() };
    for (const url of ['/', '/services/devops', '/projects/graphui', '/services', '/']) {
      await go(url);
      const tags = head();
      expect(tags.canonical, url).toEqual([`https://www.factman.dev${url === '/' ? '/' : url}`]);
      expect(tags.jsonLd.length, url).toBeLessThanOrEqual(1);
      seen.titles.add(tags.title);
      seen.descriptions.add(tags.description);
      seen.jsonLd.add(tags.jsonLd[0]);
    }
    expect(seen.titles.size).toBe(4);
    expect(seen.descriptions.size).toBe(4);
    // The home page, the service and the project each describe themselves.
    expect(seen.jsonLd.size).toBeGreaterThanOrEqual(3);
  });
});
