import { services } from '@data/services';

import { openApp, text } from './it-harness';

// IT-05 (US-08, US-09): every service's page has its own booking links, prefilled with its name.
describe('IT-05 ServiceDetailPage booking links carry the service and the channel', () => {
  it.each(services.map((s) => [s.slug, s] as const))('%s', async (slug, service) => {
    const { page } = await openApp(`/services/${slug}`);
    expect(text(page.querySelector('h1'))).toBe(service.title);
    const hrefs = [...page.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
    const name = encodeURIComponent(service.title);
    const mail = hrefs.find((h) => h.startsWith('mailto:'));
    const whatsapp = hrefs.find((h) => h.startsWith('https://wa.me/'));
    expect(mail, 'email').toContain(name);
    expect(whatsapp, 'WhatsApp').toContain(name);
    expect(
      hrefs.some((h) => h.startsWith('tel:')),
      'phone call',
    ).toBe(true);
  });
});
