import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { FilterBar, type FilterState } from './filter-bar';

const options = [
  { value: 'web', label: 'Web', count: 12 },
  { value: 'mobile', label: 'Mobile', count: 4 },
];

describe('FilterBar', () => {
  it('toggles chips, emits the state and clears', async () => {
    const changes: FilterState[] = [];
    await render(
      `<fm-filter-bar label="Filter by type" [options]="options" (filterChange)="changes.push($event)" />`,
      { imports: [FilterBar], componentProperties: { options, changes } },
    );
    expect(screen.getByRole('group', { name: 'Filter by type' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Web/, pressed: false }));
    await userEvent.click(screen.getByRole('button', { name: /Mobile/ }));
    expect(changes.at(-1)).toEqual({ selected: ['web', 'mobile'], query: '', sort: undefined });
    expect(screen.getByRole('button', { name: /Web/, pressed: true })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(changes.at(-1)?.selected).toEqual([]);
    expect(screen.getByRole('button', { name: /Web/, pressed: false })).toBeTruthy();
  });

  it('searches and sorts', async () => {
    const changes: FilterState[] = [];
    await render(
      `<fm-filter-bar [options]="options" [selected]="['web']" searchLabel="Search projects" [sortOptions]="sorts" sort="new" (filterChange)="changes.push($event)" />`,
      {
        imports: [FilterBar],
        componentProperties: {
          options,
          changes,
          sorts: [
            { value: 'new', label: 'Newest' },
            { value: 'old', label: 'Oldest' },
          ],
        },
      },
    );
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search projects' }), 'pay');
    expect(changes.at(-1)).toEqual({ selected: ['web'], query: 'pay', sort: 'new' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'old');
    expect(changes.at(-1)?.sort).toBe('old');
  });
});
