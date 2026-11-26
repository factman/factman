import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ANALYTICS_TRACKER } from '@shared';
import { iconBraces, iconServer } from '@ui/atoms/icon/icons';

import { type StackGroup, TechStack } from './tech-stack';

const groups: StackGroup[] = [
  {
    category: 'Languages',
    items: [
      { id: 'typescript', name: 'TypeScript', icon: iconBraces, years: 9, featured: true },
      { id: 'bash', name: 'Bash', icon: iconBraces },
    ],
  },
  {
    category: 'Backend',
    items: [{ id: 'node', name: 'Node.js', icon: iconServer, years: 1, featured: true }],
  },
];

const renderStack = (filter = true) => render(TechStack, { inputs: { groups, filter } });

describe('TechStack', () => {
  it('groups the technologies by area, with headings', async () => {
    await renderStack();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Languages', 'Backend']);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows years of use and announces them in words', async () => {
    await renderStack();
    const ts = screen.getByText('TypeScript').closest('li')!;
    expect(within(ts).getByText('9y').getAttribute('aria-hidden')).toBe('true');
    expect(ts.textContent).toContain('9 years');
    expect(ts.textContent).toContain('featured');
    expect(screen.getByText('Node.js').closest('li')!.textContent).toContain('1 year');
    // No start year: no years shown.
    expect(screen.getByText('Bash').closest('li')!.textContent).not.toMatch(/year/);
  });

  it('filters by area with the chips and updates the live summary', async () => {
    await renderStack();
    expect(screen.getByText('3 technologies across 2 areas')).toBeTruthy();
    const all = screen.getByRole('button', { name: 'All' });
    expect(all.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: 'Backend' }));
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Backend',
    ]);
    expect(screen.getByText('1 technology in Backend').getAttribute('aria-live')).toBe('polite');
    expect(all.getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(all);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('leaves out the chips when the filter is off', async () => {
    await renderStack(false);
    expect(screen.queryByRole('group', { name: 'Filter skills by category' })).toBeNull();
  });
});

describe('TechStack analytics (filter_used)', () => {
  it('sends filter_used with the category when a chip changes the filter', async () => {
    const track = vi.fn();
    await render(TechStack, {
      inputs: { groups, filter: true },
      providers: [{ provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Backend' }));
    await userEvent.click(screen.getByRole('button', { name: 'Backend' }));
    expect(track.mock.calls).toEqual([['filter_used', { scope: 'stack', value: 'Backend' }]]);
  });
});
