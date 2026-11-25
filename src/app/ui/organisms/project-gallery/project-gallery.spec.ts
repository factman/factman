import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ANALYTICS_TRACKER, type Project } from '@shared';

import { NO_FILTER } from './project-filter';
import { ProjectGallery } from './project-gallery';

/** Any URL renders nothing, so clicking a link in a test navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];

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
  project('todo', { status: 'archived' }),
];

const renderGallery = (inputs: Record<string, unknown> = {}) =>
  render(ProjectGallery, { inputs: { projects, ...inputs }, providers: [provideRouter([])] });

describe('ProjectGallery', () => {
  it('lists every project as a card linking to its page, in the order given', async () => {
    const { container } = await renderGallery();
    const links = [...container.querySelectorAll('.project-gallery-list > li')];
    expect(links).toHaveLength(3);
    expect(screen.queryByRole('group', { name: /Filter projects/ })).toBeNull();
  });

  it('filters by the given filter and says how many match', async () => {
    const { container } = await renderGallery({
      filterable: true,
      filter: { ...NO_FILTER, status: ['archived'] },
    });
    expect(container.querySelectorAll('.project-gallery-list > li')).toHaveLength(2);
    expect(screen.getByText('2 of 3 projects').getAttribute('aria-live')).toBe('polite');
  });

  it('emits the new filter when a chip is pressed', async () => {
    const filterChange = vi.fn();
    await render(ProjectGallery, {
      inputs: { projects, filterable: true },
      on: { filterChange },
      providers: [provideRouter([])],
    });
    await userEvent.click(screen.getByRole('button', { name: /Archived/ }));
    expect(filterChange).toHaveBeenLastCalledWith({
      status: ['archived'],
      category: [],
      query: '',
    });
  });

  it('shows the empty state with "Show all projects" when nothing matches', async () => {
    const filterChange = vi.fn();
    await render(ProjectGallery, {
      inputs: { projects, filterable: true, filter: { ...NO_FILTER, query: 'nothing like this' } },
      on: { filterChange },
      providers: [provideRouter([])],
    });
    expect(screen.getByText('No projects match')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Show all projects' }));
    expect(filterChange).toHaveBeenLastCalledWith(NO_FILTER);
  });

  it('adds the links under the grid', async () => {
    await renderGallery({ actions: [{ label: 'See all projects', href: '/projects' }] });
    expect(screen.getByRole('link', { name: /See all projects/ }).getAttribute('href')).toBe(
      '/projects',
    );
  });
});

describe('ProjectGallery analytics (filter_used, cta_click)', () => {
  it('sends filter_used for a chip, and "search" for a search, never the typed text', async () => {
    const track = vi.fn();
    await render(ProjectGallery, {
      inputs: { projects, filterable: true },
      providers: [provideRouter(ANY_ROUTE), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    await userEvent.click(screen.getByRole('button', { name: /Archived/ }));
    expect(track).toHaveBeenLastCalledWith('filter_used', {
      scope: 'projects',
      value: 'status:archived',
    });
    await userEvent.type(screen.getByRole('searchbox'), 'payments api');
    expect(track).toHaveBeenCalledWith('filter_used', { scope: 'projects', value: 'search' });
    expect(JSON.stringify(track.mock.calls)).not.toContain('payments');
  });

  it("sends cta_click from the home section's links with location projects_section", async () => {
    const track = vi.fn();
    await render(ProjectGallery, {
      inputs: { projects, actions: [{ label: 'See all projects', href: '/projects' }] },
      providers: [provideRouter(ANY_ROUTE), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    const link = screen.getByRole('link', { name: /See all projects/ });
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    expect(track).toHaveBeenCalledWith('cta_click', {
      cta_id: 'see_all_projects',
      location: 'projects_section',
    });
  });
});
