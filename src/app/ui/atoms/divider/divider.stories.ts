import { type Meta, type StoryObj, componentWrapperDecorator } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Divider } from './divider';

/** A thin decorative line, horizontal or vertical, optionally with a label. */
const meta: Meta<Divider> = {
  title: 'Atoms/Divider',
  component: Divider,
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    align: { control: 'inline-radio', options: ['center', 'start'] },
  },
  args: { orientation: 'horizontal', align: 'center', strong: false },
  // Dividers sit on surfaces such as cards; --border-subtle matches the page canvas.
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="padding: var(--padding-lg); border-radius: var(--radius-md); background: var(--bg-surface)">${story}</div>`,
    ),
  ],
};
export default meta;

type Story = StoryObj<Divider>;

export const Horizontal: Story = {};

export const Labelled: Story = {
  args: { label: 'or' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('or')).toBeVisible();
  },
};

export const LabelAtStart: Story = { args: { label: '2024', align: 'start' } };

export const Vertical: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; gap: var(--gap-sm); align-items: center; height: 24px">
        <span>Projects</span><fm-divider orientation="vertical" [strong]="strong" /><span>Blog</span>
      </div>`,
  }),
};
