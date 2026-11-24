import { type Meta, type StoryObj } from '@storybook/angular-vite';

import { StatsPanel } from './stats-panel';

/** "By the numbers": counters that count up once in view, and the career strip. */
const meta: Meta<StatsPanel> = {
  title: 'Organisms/StatsPanel',
  component: StatsPanel,
  parameters: { layout: 'padded' },
  args: {
    counters: [
      { value: 13, suffix: '+', label: 'Years of experience' },
      { value: 10, label: 'Organizations' },
      { value: 12, label: 'Roles' },
      { value: 7, label: 'Projects' },
      { value: 37, label: 'Technologies' },
      { value: 4, label: 'Articles' },
    ],
    career: [
      {
        org: 'Simple Finance',
        bars: [
          { label: 'CTO · Jan 2024 – Present', left: 79, width: 21, series: 1 },
          { label: 'CTO · Dec 2021 – Jan 2023', left: 64, width: 8.5, series: 1 },
        ],
      },
      {
        org: 'ETeam Technology',
        bars: [{ label: 'CTO & Co-Founder · May 2017 – Present', left: 31, width: 69, series: 2 }],
      },
      {
        org: 'Mazadat',
        bars: [{ label: 'Frontend Lead · Apr 2023 – Mar 2024', left: 74, width: 8, series: 3 }],
      },
      {
        org: 'Earlier roles',
        bars: [{ label: 'Engineer · 2013 – 2017', left: 0, width: 31, series: 5 }],
      },
    ],
    ticks: ['2013', '2016', '2019', '2022', 'now'],
  },
};
export default meta;

type Story = StoryObj<StatsPanel>;

export const Desktop: Story = {};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
