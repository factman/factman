import type { Meta, StoryObj } from '@storybook/angular-vite';

import { ContributionGraph } from './contribution-graph';

/** A year of made-up activity: quieter weekends, busier mid-week. */
const year = Array.from({ length: 53 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) =>
    (w * 7 + d * 3) % 9 === 0 ? 0 : d === 0 || d === 6 ? 1 : ((w + d) % 4) + 1,
  ),
);
const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

/**
 * The GitHub contribution graph (FR-33, P1), in the Stats section when site.json
 * `features.contributionGraph` is on and `pnpm sync:github` has written a snapshot.
 */
const meta: Meta<ContributionGraph> = {
  title: 'Molecules/ContributionGraph',
  component: ContributionGraph,
  args: {
    levels: year,
    months: MONTHS.map((label, i) => ({ label, week: Math.round(i * 4.35) + 1 })),
    summary:
      '1,284 contributions in the last year, on 241 days. Busiest day: 32 on 14 May 2026. Longest streak: 19 days.',
    profileUrl: 'https://github.com/example',
  },
};
export default meta;

type Story = StoryObj<ContributionGraph>;

export const Year: Story = {};

export const Quiet: Story = {
  args: {
    levels: year.map((w) => w.map(() => 0)),
    summary: 'No contributions in the last year.',
  },
};
