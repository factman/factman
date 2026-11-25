import { clients } from '@data/clients';
import { experience } from '@data/experience';
import { profile } from '@data/profile';
import { services } from '@data/services';
import { skills } from '@data/skills';

import { openApp, text } from './it-harness';

// IT-01 (US-01, US-03, US-07): the home page renders every section from the real JSON, in order.
describe('IT-01 HomePage renders every section from the data, in order', () => {
  it('has the hero, "Worked with" and the eight sections in canvas order', async () => {
    const { page } = await openApp('/');
    expect(text(page.querySelector('h1'))).toBe(profile.name);
    const ids = [...page.querySelectorAll('section[id]')].map((s) => s.id);
    expect(ids).toEqual([
      'top',
      'about',
      'stack',
      'experience',
      'services',
      'projects',
      'stats',
      'blog',
      'contact',
    ]);
    const strip = page.querySelector('fm-client-logo-strip')!;
    expect(strip.compareDocumentPosition(page.querySelector('#about')!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('fills each section from its data file', async () => {
    const { page } = await openApp('/');
    expect(page.querySelector('#top')?.textContent).toContain(profile.location.city);
    // The marquee repeats its list for the loop; every client is there.
    for (const c of clients)
      expect(page.querySelector('fm-client-logo-strip')?.innerHTML).toContain(c.name);
    expect(page.querySelectorAll('#stack li')).toHaveLength(skills.length);
    expect(page.querySelectorAll('#experience .experience-timeline-item')).toHaveLength(
      experience.length,
    );
    expect(page.querySelectorAll('#services .service-card-link')).toHaveLength(services.length);
    expect(page.querySelectorAll('#projects .project-gallery-list > li').length).toBeGreaterThan(0);
    expect(page.querySelector('#contact form')).toBeTruthy();
  });
});
