import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { ConsentStatusCard } from './consent-status-card';

/** The cookie status as a terminal printout, with "Change cookie settings". */
const meta: Meta<ConsentStatusCard> = {
  title: 'Molecules/ConsentStatusCard',
  component: ConsentStatusCard,
  argTypes: { analytics: { control: 'inline-radio', options: ['granted', 'denied', 'unset'] } },
  args: { analytics: 'unset', changeSettings: fn() },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-consent-status-card [analytics]="analytics" (changeSettings)="changeSettings()" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<ConsentStatusCard>;

export const NotDecided: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change cookie settings' }));
    await expect(args.changeSettings).toHaveBeenCalled();
  },
};

export const Granted: Story = { args: { analytics: 'granted' } };
