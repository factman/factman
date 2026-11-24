import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { PhoneReveal } from './phone-reveal';

/** The phone number, masked until the visitor asks for it. */
const meta: Meta<PhoneReveal> = {
  title: 'Molecules/PhoneReveal',
  component: PhoneReveal,
  args: { number: '+2347066780373', revealed: fn() },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px"><fm-phone-reveal [number]="number" (revealed)="revealed()" /></div>`,
  }),
};
export default meta;

export const Reveal: StoryObj<PhoneReveal> = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show number' }));
    await expect(await canvas.findByRole('link', { name: '+234 706 678 0373' })).toBeVisible();
    await expect(args.revealed).toHaveBeenCalled();
  },
};
