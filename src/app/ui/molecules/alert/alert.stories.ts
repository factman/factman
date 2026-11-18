import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Alert } from './alert';

const TONES = ['info', 'success', 'warning', 'danger', 'neutral'];

/** A message in the page; the tone's icon and the title carry the meaning. */
const meta: Meta<Alert> = {
  title: 'Molecules/Alert',
  component: Alert,
  argTypes: { tone: { control: 'inline-radio', options: TONES } },
  args: { tone: 'info', title: 'Heads up', dismissible: false, glass: false, dismissed: fn() },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 480px"><fm-alert [tone]="tone" [title]="title" [dismissible]="dismissible" [glass]="glass" (dismissed)="dismissed()">I'm booked until March; new projects start after that.</fm-alert></div>`,
  }),
};
export default meta;

type Story = StoryObj<Alert>;

export const Info: Story = {};

export const Dismissible: Story = {
  args: { tone: 'danger', title: "Your message wasn't sent", dismissible: true },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(args.dismissed).toHaveBeenCalled();
  },
};

export const Glass: Story = { args: { glass: true, tone: 'success', title: 'Message sent' } };

export const Tones: Story = {
  render: () => ({
    props: { tones: TONES },
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--gap-sm); max-width: 480px">
        @for (t of tones; track t) { <fm-alert [tone]="t" [title]="t">The {{ t }} tone.</fm-alert> }
      </div>`,
  }),
};
