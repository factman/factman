import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { CareerStrip } from './career-strip';

/** Roles on a time axis; the page computes rows and ticks from experience.json. */
const meta: Meta<CareerStrip> = {
  title: 'Molecules/CareerStrip',
  component: CareerStrip,
  args: {
    rows: [
      {
        org: 'Simple Finance',
        bars: [
          { label: 'CTO · Dec 2021 – Jan 2023', left: 66, width: 9, series: 1 },
          { label: 'CTO · Jan 2024 – Present', left: 85, width: 15, series: 1 },
        ],
      },
      {
        org: 'Mazadat',
        bars: [
          { label: 'Senior Frontend Engineer · Apr – Oct 2023', left: 78, width: 4, series: 2 },
          { label: 'Frontend Lead · Oct 2023 – Mar 2024', left: 82, width: 4, series: 3 },
        ],
      },
      {
        org: 'ETeam Technology',
        bars: [{ label: 'CTO & Co-Founder · May 2017 – Present', left: 32, width: 68, series: 4 }],
      },
      {
        org: 'Earlier roles',
        bars: [{ label: 'Developer roles · 2013 – 2017', left: 0, width: 32, series: 5 }],
      },
    ],
    ticks: ['2013', '2016', '2019', '2022', 'now'],
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 640px"><fm-career-strip [rows]="rows" [ticks]="ticks" /></div>`,
  }),
};
export default meta;

export const Career: StoryObj<CareerStrip> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure', { name: /Career strip/ })).toBeVisible();
  },
};
