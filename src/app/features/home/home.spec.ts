import { render, screen } from '@testing-library/angular';

import { ClientsRepository } from '@core/data';

import { Home } from './home';

describe('Home (Testing Library smoke test)', () => {
  it('shows the site heading', async () => {
    await render(Home);
    expect(screen.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeTruthy();
  });
});

describe('Home "Worked with" strip (FR-52)', () => {
  it('is shown with the clients from the data', async () => {
    await render(Home);
    expect(screen.getByRole('region', { name: 'Worked with' })).toBeTruthy();
  });

  it('is omitted when there are no clients', async () => {
    await render(Home, {
      providers: [{ provide: ClientsRepository, useValue: { all: () => [] } }],
    });
    expect(screen.queryByRole('region', { name: 'Worked with' })).toBeNull();
  });
});

describe('Home About (FR-10)', () => {
  it('has the #about section with the story and the #resume anchor inside it', async () => {
    const { container } = await render(Home);
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
    const { container } = await render(Home);
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
    const { container } = await render(Home);
    const section = container.querySelector('section#experience')!;
    const { experience } = await import('@data/experience');
    expect(section.querySelectorAll('.experience-timeline-item')).toHaveLength(experience.length);
    expect(section.querySelector('aside.glance')).toBeTruthy();
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
