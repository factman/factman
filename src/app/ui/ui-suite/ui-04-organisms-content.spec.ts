/**
 * UI-04 (PRD §12): organisms, content. ExperienceTimeline's "Show more" keeps aria-expanded in
 * sync. ProjectGallery combines filters and shows an empty state with a way back. TechStack's
 * category filter works from the keyboard. StatsPanel's charts have text alternatives and its
 * counters animate once (the final value at once with reduced motion).
 */
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { Project } from '@shared';
import { iconBraces, iconServer } from '@ui/atoms/icon/icons';
import {
  ExperienceTimeline,
  type TimelineEntry,
} from '@ui/organisms/experience-timeline/experience-timeline';
import { NO_FILTER, type ProjectFilter } from '@ui/organisms/project-gallery/project-filter';
import { ProjectGallery } from '@ui/organisms/project-gallery/project-gallery';
import { StatsPanel } from '@ui/organisms/stats-panel/stats-panel';
import { type StackGroup, TechStack } from '@ui/organisms/tech-stack/tech-stack';

const entries: TimelineEntry[] = [
  {
    id: 'simple-finance',
    organization: 'Simple Finance',
    roles: [
      {
        id: 'sf-cto',
        title: 'Chief Technology Officer',
        period: 'Jan 2024 – Present',
        duration: '2 yrs 11 mos',
        highlights: ['One', 'Two', 'Three', 'Four'],
        skills: ['Angular'],
        current: true,
      },
    ],
  },
];

const project = (slug: string, over: Partial<Project> = {}): Project =>
  ({
    id: slug,
    slug,
    title: slug.toUpperCase(),
    summary: `${slug} summary`,
    category: 'Web',
    status: 'maintained',
    visibility: 'public',
    featured: true,
    stack: ['TypeScript'],
    startedAt: '2020',
    links: {},
    ...over,
  }) as Project;
const projects = [
  project('graphui', { category: 'Open source' }),
  project('neoclock', { status: 'archived' }),
  project('vault', { status: 'archived', category: 'Fintech' }),
];

const groups: StackGroup[] = [
  {
    category: 'Languages',
    items: [{ id: 'typescript', name: 'TypeScript', icon: iconBraces, years: 9, featured: true }],
  },
  {
    category: 'Backend',
    items: [{ id: 'node', name: 'Node.js', icon: iconServer, years: 6, featured: true }],
  },
];

describe('UI-04 Organisms: content', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('ExperienceTimeline keeps aria-expanded in sync from the keyboard', async () => {
    await render(ExperienceTimeline, { inputs: { entries } });
    const list = document.getElementById('sf-cto-highlights')!;
    const more = screen.getByRole('button', { name: /Show 2 more/ });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(more.getAttribute('aria-controls')).toBe('sf-cto-highlights');
    more.focus();
    await userEvent.keyboard('{Enter}');
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    await userEvent.keyboard(' ');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  describe('ProjectGallery', () => {
    /** Renders the gallery as /projects does: the filter goes out and comes back in. */
    const renderGallery = async () => {
      const view = await render(ProjectGallery, {
        inputs: { projects, filterable: true, filter: NO_FILTER },
        providers: [provideRouter([])],
        on: {
          filterChange: (f: ProjectFilter) => view.fixture.componentRef.setInput('filter', f),
        },
      });
      return view;
    };
    const cards = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

    it('combines a status and a category filter, from the keyboard', async () => {
      const { fixture } = await renderGallery();
      screen.getByRole('button', { name: /Archived/ }).focus();
      await userEvent.keyboard(' ');
      fixture.detectChanges();
      expect(cards()).toEqual(['NEOCLOCK', 'VAULT']);
      screen.getByRole('button', { name: /Fintech/ }).focus();
      await userEvent.keyboard('{Enter}');
      fixture.detectChanges();
      expect(cards()).toEqual(['VAULT']);
      expect(screen.getByText('1 of 3 projects')).toBeTruthy();
    });

    it('shows the empty state with a way back when nothing matches', async () => {
      const { fixture } = await renderGallery();
      await userEvent.type(screen.getByRole('searchbox'), 'nothing like this');
      fixture.detectChanges();
      expect(await screen.findByText('No projects match')).toBeTruthy();
      await userEvent.click(screen.getByRole('button', { name: 'Show all projects' }));
      fixture.detectChanges();
      expect(cards()).toHaveLength(3);
    });
  });

  it('TechStack filters by category from the keyboard, announcing the choice', async () => {
    await render(TechStack, { inputs: { groups, filter: true } });
    const filters = within(screen.getByRole('group', { name: 'Filter skills by category' }));
    const all = filters.getByRole('button', { name: 'All' });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    all.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(filters.getByRole('button', { name: 'Languages' }));
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const backend = filters.getByRole('button', { name: 'Backend' });
    expect(backend.getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.getByText(/1 technology in Backend/)).toBeTruthy();
  });

  describe('StatsPanel', () => {
    const counters = [{ value: 12, label: 'Years building software' }];
    const career = [
      { org: 'Simple Finance', bars: [{ label: 'CTO · Jan 2024 – Present', left: 85, width: 15 }] },
    ];
    const contributions = {
      levels: [[0, 1, 2, 3, 4, 0, 0]],
      months: [{ label: 'Jan', week: 0 }],
      summary: '1,234 contributions in the last year',
      profileUrl: 'https://github.com/factman',
    };

    it('gives each chart a text alternative', async () => {
      await render(StatsPanel, {
        inputs: { counters, career, ticks: ['2013', 'now'], contributions },
      });
      const figures = screen.getAllByRole('figure');
      expect(figures.length).toBe(2);
      for (const figure of figures) expect(figure.getAttribute('aria-labelledby')).toBeTruthy();
      // The career strip's bars are read as a list; the graph as its summary.
      expect(screen.getByText(/Simple Finance:/).textContent).toContain('CTO · Jan 2024 – Present');
      expect(screen.getByText('1,234 contributions in the last year')).toBeTruthy();
    });

    it('animates its counters once', async () => {
      const observers: {
        fire: (e: { isIntersecting: boolean }[]) => void;
        disconnected: boolean;
      }[] = [];
      vi.stubGlobal('matchMedia', () => ({ matches: false }));
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
            observers.push({ fire: cb, disconnected: false });
          }
          observe() {
            // The test fires the callback itself.
          }
          disconnect() {
            observers[observers.length - 1].disconnected = true;
          }
        },
      );
      const frames: FrameRequestCallback[] = [];
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
      const { container, fixture } = await render(StatsPanel, { inputs: { counters } });
      /** Runs the animation frames until the count is done (the first frame records the start). */
      const flush = () => {
        for (let i = 0; i < 10 && frames.length; i++) {
          frames.splice(0).forEach((cb) => cb(i === 0 ? 0 : Number.MAX_SAFE_INTEGER));
        }
      };
      observers[0].fire([{ isIntersecting: true }]);
      flush();
      fixture.detectChanges();
      expect(frames).toHaveLength(0);
      // It stops watching after the first count, so scrolling back into view never counts again.
      expect(observers[0].disconnected).toBe(true);
      expect(container.querySelector('.stat-counter-value')?.textContent).toBe('12');
      expect(observers).toHaveLength(1);
    });

    it('shows the final value at once with reduced motion', async () => {
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
      const io = vi.fn();
      vi.stubGlobal('IntersectionObserver', io);
      const reduced = await render(StatsPanel, { inputs: { counters } });
      expect(reduced.container.querySelector('.stat-counter-value')?.textContent).toBe('12');
      expect(io).not.toHaveBeenCalled();
    });
  });
});
