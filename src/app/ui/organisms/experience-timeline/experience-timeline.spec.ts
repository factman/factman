import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ExperienceTimeline, initials, type TimelineEntry } from './experience-timeline';

// Seeded data: one organization with two roles (one current), one with a single past role.
const entries: TimelineEntry[] = [
  {
    id: 'simple-finance',
    organization: 'Simple Finance',
    website: 'https://simplefinance.ng',
    logo: '/assets/clients/simple-finance.png',
    total: '4 yrs 1 mo · 2 roles',
    roles: [
      {
        id: 'sf-cto',
        title: 'Chief Technology Officer',
        period: 'Jan 2024 – Present',
        duration: '2 yrs 11 mos',
        location: 'Lagos, Nigeria',
        type: 'Full-time',
        summary: 'Lead the technology team.',
        highlights: ['One', 'Two', 'Three', 'Four'],
        skills: ['Angular', 'Node.js'],
        current: true,
      },
      {
        id: 'sf-cto-1',
        title: 'Chief Technology Officer',
        period: 'Dec 2021 – Jan 2023',
        duration: '1 yr 2 mos',
        highlights: [],
        skills: [],
        current: false,
      },
    ],
  },
  {
    id: 'mazadat',
    organization: 'Mazadat',
    roles: [
      {
        id: 'mz-lead',
        title: 'Frontend Lead Engineer',
        period: 'Oct 2023 – Mar 2024',
        duration: '6 mos',
        highlights: ['Drove frontend strategy'],
        skills: ['React'],
        current: false,
      },
    ],
  },
];

const renderTimeline = () => render(ExperienceTimeline, { inputs: { entries } });

describe('initials', () => {
  it('takes the first letters of up to two words', () => {
    expect(initials('Simple Finance')).toBe('SF');
    expect(initials('Mazadat')).toBe('M');
    expect(initials('Peace Mass Transit')).toBe('PM');
  });
});

describe('ExperienceTimeline', () => {
  it('lists the organizations in the order given, with their roles nested', async () => {
    await renderTimeline();
    const orgs = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
    expect(orgs[0]).toContain('Simple Finance');
    expect(orgs[1]).toBe('Mazadat');
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3);
    expect(screen.getByText('4 yrs 1 mo · 2 roles')).toBeTruthy();
  });

  it('shows dates, duration, "Present" and a Current tag for a current role', async () => {
    await renderTimeline();
    const current = screen.getAllByRole('article')[0];
    expect(within(current).getByText('Jan 2024 – Present')).toBeTruthy();
    expect(within(current).getByText('· 2 yrs 11 mos')).toBeTruthy();
    expect(within(current).getByText('Current')).toBeTruthy();
    expect(within(screen.getAllByRole('article')[1]).queryByText('Current')).toBeNull();
  });

  it('links the organization safely in a new tab, and shows initials without a logo', async () => {
    const { container } = await renderTimeline();
    const link = screen.getByRole('link', { name: /Simple Finance/ });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(container.querySelector('.experience-timeline-logo.is-initials')!.textContent).toBe('M');
  });

  it('expands and collapses highlights with the keyboard (FR-16)', async () => {
    await renderTimeline();
    const list = document.getElementById('sf-cto-highlights')!;
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    const more = screen.getByRole('button', { name: /Show 2 more/ });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(more.getAttribute('aria-controls')).toBe('sf-cto-highlights');
    more.focus();
    await userEvent.keyboard('{Enter}');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(more.textContent).toContain('Show less');

    await userEvent.keyboard(' ');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('has no "Show more" when every highlight fits the preview', async () => {
    await renderTimeline();
    const mazadat = screen.getAllByRole('article')[2];
    expect(within(mazadat).queryByRole('button')).toBeNull();
  });

  it('shows the skills used as chips', async () => {
    await renderTimeline();
    const skills = screen.getAllByRole('list', { name: 'Skills used' })[0];
    expect(
      within(skills)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.trim()),
    ).toEqual(['Angular', 'Node.js']);
  });

  it('puts CareerGlance beside the timeline when given', async () => {
    await render(ExperienceTimeline, {
      inputs: {
        entries,
        glance: {
          roles: [
            { title: 'Chief Technology Officer', description: 'Simple Finance · since Jan 2024' },
          ],
          stats: [{ value: 13, suffix: '+', label: 'years since 2013' }],
          resumeHref: '#resume',
        },
      },
    });
    expect(screen.getByRole('complementary', { name: 'At a glance' })).toBeTruthy();
  });
});
