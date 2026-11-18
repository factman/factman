import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { StatusDot } from './status-dot';

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'];

/** A coloured dot with its status in words. Colour never carries the meaning alone. */
const meta: Meta<StatusDot> = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  argTypes: { tone: { control: 'inline-radio', options: TONES } },
  args: { label: 'Available for work', tone: 'success', pulse: false },
};
export default meta;

type Story = StoryObj<StatusDot>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Available for work')).toBeVisible();
  },
};

/** The ring stops when the visitor asks for reduced motion. */
export const Pulse: Story = { args: { pulse: true } };

export const Tones: Story = {
  render: () => ({
    props: { tones: TONES },
    template: `
      <span style="display: inline-flex; flex-direction: column; gap: var(--gap-xs)">
        @for (t of tones; track t) { <fm-status-dot [tone]="t" [label]="t" /> }
      </span>`,
  }),
};
