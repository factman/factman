import { render, screen } from '@testing-library/angular';

import { Table } from './table';

describe('Table', () => {
  it('is a captioned table with column and row headers in a focusable scroll area', async () => {
    await render(Table, {
      inputs: {
        caption: 'Cookies this site uses',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'purpose', label: 'Purpose' },
          { key: 'days', label: 'Days', align: 'end' },
        ],
        rows: [
          { name: 'fm-consent', purpose: 'Remembers your cookie choice', days: 365 },
          { name: '_ga', purpose: 'Counts visits (only with consent)', days: 400 },
        ],
      },
    });
    const table = screen.getByRole('table', { name: 'Cookies this site uses' });
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('rowheader').map((h) => h.textContent?.trim())).toEqual([
      'fm-consent',
      '_ga',
    ]);
    expect(screen.getByRole('columnheader', { name: 'Days' }).classList).toContain('is-end');
    const scroll = screen.getByRole('region', { name: 'Cookies this site uses' });
    expect(scroll.getAttribute('tabindex')).toBe('0');
    expect(scroll.contains(table)).toBe(true);
  });
});
