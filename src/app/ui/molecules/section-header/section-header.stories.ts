import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { SectionHeader } from './section-header';

/** The top of a page section: numbered eyebrow, title, intro and an optional action. */
const meta: Meta<SectionHeader> = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center'] },
    level: { control: 'inline-radio', options: [1, 2, 3] },
  },
  args: {
    index: '02',
    eyebrow: 'Services',
    title: 'What I can build for you',
    description: 'Web and mobile products, payment systems, and the cloud they run on.',
    level: 2,
    align: 'start',
  },
};
export default meta;

type Story = StoryObj<SectionHeader>;

export const Start: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What I can build for you',
    );
  },
};

export const Center: Story = { args: { align: 'center' } };
