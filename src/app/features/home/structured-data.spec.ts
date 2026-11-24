import { homeStructuredData } from './structured-data';

describe('homeStructuredData', () => {
  const data = homeStructuredData(
    {
      url: 'https://www.factman.dev',
      name: 'Odunayo Mohammed',
      description: 'Portfolio',
      ogImage: 'og/default.jpg',
    },
    {
      name: 'Odunayo Mohammed',
      headline: 'Fullstack Software Engineer and CTO',
      summary: 'I build products.',
      location: { city: 'Lagos', country: 'Nigeria' },
    },
    {
      email: 'me@example.com',
      links: [{ id: 'github', label: 'GitHub', url: 'https://github.com/factman' }],
    } as never,
  );
  const [person, website] = data['@graph'] as Record<string, Record<string, unknown> & unknown[]>[];

  it('describes the Person with a city and country only, and their profiles', () => {
    expect(person['@type']).toBe('Person');
    expect(person['address']).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Lagos',
      addressCountry: 'Nigeria',
    });
    expect(person['sameAs']).toEqual(['https://github.com/factman']);
    expect(person['image']).toBe('https://www.factman.dev/assets/og/default.jpg');
  });

  it('links the WebSite to the Person as its publisher', () => {
    expect(website['@type']).toBe('WebSite');
    expect(website['publisher']).toEqual({ '@id': person['@id'] });
  });
});
