import { render, screen } from '@testing-library/angular';

import { StatsPanel } from './stats-panel';

const counters = [
  { value: 13, suffix: '+', label: 'Years of experience' },
  { value: 10, label: 'Organizations' },
];
const career = [
  { org: 'Simple Finance', bars: [{ label: 'CTO · Jan 2024 – Present', left: 85, width: 15 }] },
];

describe('StatsPanel', () => {
  it('shows each counter with its final value in its accessible name', async () => {
    const { container } = await render(StatsPanel, { inputs: { counters } });
    expect(container.querySelectorAll('.stats-panel-counters > li')).toHaveLength(2);
    expect(container.textContent).toContain('Years of experience');
    expect(container.textContent).toContain('13');
  });

  it('shows the career strip when there are rows', async () => {
    await render(StatsPanel, { inputs: { counters, career, ticks: ['2013', 'now'] } });
    expect(screen.getByRole('figure')).toBeTruthy();
    expect(screen.getByText('Simple Finance')).toBeTruthy();
  });

  it('shows the GitHub contribution graph only when given one (FR-33)', async () => {
    const { container, rerender } = await render(StatsPanel, {
      inputs: { counters: [{ value: 3, label: 'Projects' }] },
    });
    expect(container.querySelector('fm-contribution-graph')).toBeNull();
    await rerender({
      inputs: {
        counters: [{ value: 3, label: 'Projects' }],
        contributions: {
          levels: [[0, 1, 2, 3, 4, 0, 0]],
          months: [],
          summary: '10 contributions in the last year, on 4 days.',
          profileUrl: 'https://github.com/factman',
        },
      },
    });
    expect(screen.getByRole('figure', { name: 'GitHub contributions' }).textContent).toContain(
      '10 contributions in the last year',
    );
  });
});
