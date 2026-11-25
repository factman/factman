import { projects } from '@data/projects';
import { services } from '@data/services';

import { openApp, text } from './it-harness';

// IT-09 (US-24): every slug in the data resolves to its page; an unknown slug shows NotFound.
describe('IT-09 Every slug resolves to a route; an unknown slug shows NotFound', () => {
  it('opens every service and project by its slug', async () => {
    const { go } = await openApp('/');
    for (const s of services)
      expect(text((await go(`/services/${s.slug}`)).querySelector('h1'))).toBe(s.title);
    for (const p of projects)
      expect(text((await go(`/projects/${p.slug}`)).querySelector('h1'))).toBe(p.title);
  });

  it.each(['/services/no-such-service', '/projects/no-such-project'])(
    '%s shows NotFound',
    async (url) => {
      const { page } = await openApp(url);
      expect(text(page.querySelector('h1'))).toBe('command not found');
    },
  );
});
