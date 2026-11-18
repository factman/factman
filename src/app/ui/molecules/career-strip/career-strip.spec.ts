import { render, screen } from '@testing-library/angular';

import { CareerStrip } from './career-strip';

const rows = [
  {
    org: 'Simple Finance',
    bars: [{ label: 'CTO · Jan 2024 – Present', left: 85, width: 15, series: 1 as const }],
  },
  {
    org: 'ETeam Technology',
    bars: [
      { label: 'CTO · May 2017 – Present', left: 33, width: 67, series: 4 as const },
      { label: 'Developer · 2015 – 2017', left: 15, width: 18 },
    ],
  },
];

describe('CareerStrip', () => {
  it('draws bars at their positions and lists the roles for screen readers', async () => {
    const { container } = await render(CareerStrip, {
      inputs: { rows, ticks: ['2013', '2019', 'now'] },
    });
    const figure = screen.getByRole('figure', { name: /Career strip/ });
    expect(figure.querySelector('.career-strip-chart')?.getAttribute('aria-hidden')).toBe('true');
    const bars = container.querySelectorAll<HTMLElement>('.career-strip-bar');
    expect(bars).toHaveLength(3);
    expect(bars[0].style.left).toBe('85%');
    expect(bars[0].style.width).toBe('15%');
    expect(bars[0].getAttribute('title')).toBe('CTO · Jan 2024 – Present');
    const items = screen
      .getAllByRole('listitem')
      .map((li) => li.textContent?.replace(/\s+/g, ' ').trim());
    expect(items).toEqual([
      'Simple Finance: CTO · Jan 2024 – Present',
      'ETeam Technology: CTO · May 2017 – Present; Developer · 2015 – 2017',
    ]);
  });
});
