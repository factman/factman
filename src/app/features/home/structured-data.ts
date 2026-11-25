import type { JsonLd } from '@core/seo';
import type { Contact, Profile, Site } from '@shared';

/**
 * The home page's schema.org data (ETE-113): the Person (name, role, photo, city and country only,
 * the profiles they own) and the WebSite, linked in one @graph. Medium hosts the articles, so
 * there is no BlogPosting.
 */
export function homeStructuredData(
  site: Pick<Site, 'url' | 'name' | 'description' | 'ogImage'>,
  profile: Pick<Profile, 'name' | 'headline' | 'summary' | 'location'>,
  contact: Pick<Contact, 'links' | 'email'>,
): JsonLd {
  const person = `${site.url}/#person`;
  return {
    '@graph': [
      {
        '@type': 'Person',
        '@id': person,
        name: profile.name,
        jobTitle: profile.headline,
        description: profile.summary,
        url: site.url,
        image: `${site.url}/assets/${site.ogImage}`,
        email: `mailto:${contact.email}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: profile.location.city,
          addressCountry: profile.location.country,
        },
        sameAs: contact.links.map((l) => l.url),
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: site.url,
        name: site.name,
        description: site.description,
        publisher: { '@id': person },
      },
    ],
  };
}
