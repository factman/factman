import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Stepper } from './stepper';

/** Numbered steps: a process overview, or progress through a flow. */
const meta: Meta<Stepper> = {
  title: 'Molecules/Stepper',
  component: Stepper,
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  args: {
    orientation: 'horizontal',
    steps: [
      { title: 'Discover', description: 'A call about goals and users' },
      { title: 'Design', description: 'Flows and screens to agree on' },
      { title: 'Build', description: 'Weekly releases you can try' },
      { title: 'Launch', description: 'Go live, then support' },
    ],
  },
};
export default meta;

type Story = StoryObj<Stepper>;

export const Process: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
  },
};

export const Progress: Story = {
  args: {
    orientation: 'vertical',
    steps: [
      { title: 'Pick a time', status: 'completed' },
      { title: 'Your details', description: 'Name, email and a note', status: 'current' },
      { title: 'Confirm', status: 'upcoming' },
    ],
  },
};
