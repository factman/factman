import { render, screen } from '@testing-library/angular';

import { ContributionGraph } from './contribution-graph';

const levels = [
  [0, 1, 2, 3, 4, 0, 1],
  [2, 2, 0, 0, 4, 3, 1],
];

describe('ContributionGraph', () => {
  it('is a figure named by its caption, with the summary as its text alternative', async () => {
    await render(ContributionGraph, {
      inputs: { levels, summary: '20 contributions in the last year, on 10 days.' },
    });
    const figure = screen.getByRole('figure', { name: 'GitHub contributions' });
    expect(figure.textContent).toContain('20 contributions in the last year, on 10 days.');
    // The squares are decoration: the caption carries the facts.
    expect(figure.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws a square per day, shaded by level, under the month labels', async () => {
    const { container } = await render(ContributionGraph, {
      inputs: {
        levels,
        summary: 's',
        months: [
          { label: 'Nov', week: 0 },
          { label: 'Dec', week: 1 },
        ],
      },
    });
    const days = container.querySelectorAll('rect.contribution-graph-day');
    expect(days).toHaveLength(14);
    expect(days[4].getAttribute('class')).toContain('is-level-4');
    expect(days[7].getAttribute('x')).toBe('14');
    expect([...container.querySelectorAll('text')].map((t) => t.textContent)).toEqual([
      'Nov',
      'Dec',
    ]);
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 25 113');
  });

  it('links to the GitHub profile in a new tab, when given', async () => {
    await render(ContributionGraph, {
      inputs: { levels, summary: 's', profileUrl: 'https://github.com/factman' },
    });
    const link = screen.getByRole('link', { name: /View on GitHub/ });
    expect(link.getAttribute('href')).toBe('https://github.com/factman');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
