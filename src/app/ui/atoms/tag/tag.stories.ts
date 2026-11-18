import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconCode } from '../icon/icons';
import { Tag } from './tag';

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'];

/** A short, non-interactive label coloured by tone. */
const meta: Meta<Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'outline'] },
    tone: { control: 'inline-radio', options: TONES },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { variant: 'solid', tone: 'neutral', size: 'md', dot: false },
  render: (args) => ({
    props: args,
    template: `<fm-tag [variant]="variant" [tone]="tone" [size]="size" [dot]="dot" [leadingIcon]="leadingIcon">TypeScript</fm-tag>`,
  }),
};
export default meta;

type Story = StoryObj<Tag>;

export const Solid: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('TypeScript')).toHaveClass('fm-tag');
  },
};

export const Outline: Story = { args: { variant: 'outline' } };

export const WithDot: Story = { args: { tone: 'success', dot: true } };

export const WithIcon: Story = { args: { leadingIcon: iconCode } };

export const Tones: Story = {
  render: () => ({
    props: { tones: TONES },
    template: `
      <span style="display: inline-flex; flex-wrap: wrap; gap: var(--gap-xs)">
        @for (t of tones; track t) { <fm-tag [tone]="t" [dot]="true">{{ t }}</fm-tag> }
        @for (t of tones; track t) { <fm-tag [tone]="t" variant="outline">{{ t }}</fm-tag> }
      </span>`,
  }),
};
