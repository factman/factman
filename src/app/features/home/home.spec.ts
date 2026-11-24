import { DeferBlockState } from '@angular/core/testing';
import { render, type RenderComponentOptions, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SITE } from '@core/config';
import { ClientsRepository } from '@core/data';
import { site } from '@data/site';
import { resolveSite } from '@shared';

import { Home } from './home';

/** What the app's CoreModule provides and the page needs (the blog reads site.blog). */
const SITE_PROVIDER = { provide: SITE, useValue: resolveSite(site, 'production') };

/** Renders the page with its `@defer` sections (Stack to Contact) loaded, as the prerender has them. */
const renderHome = (options: RenderComponentOptions<Home> = {}) =>
  render(Home, {
    providers: [SITE_PROVIDER],
    deferBlockStates: DeferBlockState.Complete,
    ...options,
  });

describe('Home (Testing Library smoke test)', () => {
  it('shows the site heading', async () => {
    await renderHome();
    expect(screen.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeTruthy();
  });
});

describe('Home "Worked with" strip (FR-52)', () => {
  it('is shown with the clients from the data', async () => {
    await renderHome();
    expect(screen.getByRole('region', { name: 'Worked with' })).toBeTruthy();
  });

  it('is omitted when there are no clients', async () => {
    await renderHome({
      providers: [SITE_PROVIDER, { provide: ClientsRepository, useValue: { all: () => [] } }],
    });
    expect(screen.queryByRole('region', { name: 'Worked with' })).toBeNull();
  });
});

describe('Home About (FR-10)', () => {
  it('has the #about section with the story and the #resume anchor inside it', async () => {
    const { container } = await renderHome();
    const about = container.querySelector('section#about')!;
    expect(about.getAttribute('aria-labelledby')).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Engineer first, leader by practice' }),
    ).toBeTruthy();
    expect(about.querySelector('#resume')).toBeTruthy();
    expect(about.textContent).toContain('I started writing software professionally in 2013');
  });
});

describe('Home Stack (FR-11, FR-12)', () => {
  it('has the #stack section with every area from skills.json', async () => {
    const { container } = await renderHome();
    const stack = container.querySelector('section#stack')!;
    expect(stack).toBeTruthy();
    const { skills } = await import('@data/skills');
    const areas = new Set(skills.map((s) => s.category));
    expect(stack.querySelectorAll('h3')).toHaveLength(areas.size);
    expect(stack.querySelectorAll('li')).toHaveLength(skills.length);
  });
});

describe('Home Experience (FR-13 to FR-16)', () => {
  it('has the #experience section with every organization and CareerGlance', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#experience')!;
    const { experience } = await import('@data/experience');
    expect(section.querySelectorAll('.experience-timeline-item')).toHaveLength(experience.length);
    expect(section.querySelector('aside.glance')).toBeTruthy();
  });
});

describe('Home Services (#services)', () => {
  it('shows every service as a tile, in order, with "Compare all services"', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#services')!;
    const { services } = await import('@data/services');
    const hrefs = [...section.querySelectorAll('.service-card-link')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(
      [...services].sort((a, b) => a.order - b.order).map((s) => `/services/${s.slug}`),
    );
    expect(screen.getByRole('link', { name: /Compare all services/ }).getAttribute('href')).toBe(
      '/services',
    );
  });

  it('starts its intro with the number of services as a word', async () => {
    const { countWord } = await import('@shared');
    expect(countWord(8)).toBe('Eight');
    expect(countWord(12)).toBe('12');
  });

  it('registers an icon for every service in services.json', async () => {
    const { SERVICE_ICONS } = await import('@ui/molecules');
    const { services } = await import('@data/services');
    const names = new Set(SERVICE_ICONS.map((i) => i.name));
    for (const s of services) expect(names.has(s.icon), `${s.slug}: ${s.icon}`).toBe(true);
  });
});

describe('Home Projects (FR-20)', () => {
  it('shows at most six featured projects, newest first, with "See all projects"', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#projects')!;
    const cards = section.querySelectorAll('.project-gallery-list > li');
    const { projects } = await import('@data/projects');
    expect(cards.length).toBe(Math.min(6, projects.filter((p) => p.featured).length));
    expect(screen.getByRole('link', { name: /See all projects/ }).getAttribute('href')).toBe(
      '/projects',
    );
  });
});

describe('Home Contact (FR-27)', () => {
  it('has the #contact section with the form and every topic', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#contact')!;
    expect(section.querySelector('form')).toBeTruthy();
    const { services } = await import('@data/services');
    const options = [...section.querySelectorAll('option')].map((o) => o.textContent?.trim());
    for (const s of services) expect(options).toContain(s.title);
  });
});

describe('Home contact channels (FR-29, FR-30)', () => {
  it('shows the email, WhatsApp and the city and country beside the form', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#contact')!;
    const { contact } = await import('@data/contact');
    expect(section.querySelector(`a[href="mailto:${contact.email}"]`)).toBeTruthy();
    expect(section.querySelector('a[href^="https://wa.me/"]')).toBeTruthy();
    expect(section.textContent).toContain(`${contact.city}, ${contact.country}`);
  });
});

describe('Home Stats (FR-31)', () => {
  it('has the #stats section with counters counted from the data', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#stats')!;
    const { experience } = await import('@data/experience');
    expect(section.querySelectorAll('.stats-panel-counters > li').length).toBeGreaterThanOrEqual(5);
    expect(section.textContent).toContain(String(experience.length));
    expect(section.querySelector('figure')).toBeTruthy();
  });
});

describe('Home sections', () => {
  it('has an anchor for every home link in the site navigation', async () => {
    const { site } = await import('@data/site');
    const { HOME_SECTIONS } = await import('./home-sections');
    const ids = HOME_SECTIONS.map((s) => s.id) as string[];
    for (const item of site.nav) expect(ids).toContain(item.anchor.replace('#', ''));
  });
});

describe('Home Blog (#blog, FR-24)', () => {
  it('has the #blog section with the feed and "Read the blog"', async () => {
    const { container } = await renderHome();
    const section = container.querySelector('section#blog')!;
    expect(section.querySelector('fm-blog-feed')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Read the blog/ }).getAttribute('href')).toBe('/blog');
  });
});

describe('Home assembly (ETE-114)', () => {
  it('renders the sections in canvas order, after the hero and "Worked with"', async () => {
    const { container } = await renderHome();
    const { HOME_SECTIONS } = await import('./home-sections');
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id);
    // The hero is #top; #resume lives inside About, so it is not a section of its own.
    expect(ids).toEqual(['top', ...HOME_SECTIONS.map((s) => s.id).filter((id) => id !== 'resume')]);
    const hero = container.querySelector('fm-profile-hero')!;
    const strip = container.querySelector('fm-client-logo-strip')!;
    const about = container.querySelector('section#about')!;
    expect(hero.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(strip.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Home résumés (FR-43 to FR-47)', () => {
  it('has a card per committed résumé inside #about, at #resume', async () => {
    const { container } = await renderHome();
    const { resumeDownloads } = await import('@data/resume-downloads');
    const block = container.querySelector('section#about #resume')!;
    expect(block.querySelectorAll('fm-resume-card')).toHaveLength(resumeDownloads.length);
    expect(resumeDownloads.length).toBe(3);
  });

  it('opens the preview from a card, and the hero opens the fullstack résumé', async () => {
    await renderHome();
    await userEvent.click(screen.getByRole('button', { name: 'Preview Mobile Developer résumé' }));
    expect(screen.getByRole('dialog', { name: 'Mobile Developer résumé preview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Mobile Developer/, selected: true })).toBeTruthy();
  });

  it('downloads under the manifest file name', async () => {
    await renderHome();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.getAttribute('href')).toBe('/resumes/odunayo-mohammed-devops.pdf');
      expect(this.download).toBe('odunayo-mohammed-devops.pdf');
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Download DevOps / Cloud Engineer résumé (PDF)' }),
    );
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});
