import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconClock, iconMail, iconPhone } from '@ui/atoms/icon/icons';

import { ContactMethod } from './contact-method';

/** One way to reach Odunayo, as a row or as the InfoTile. */
const meta: Meta<ContactMethod> = {
  title: 'Molecules/ContactMethod',
  component: ContactMethod,
  argTypes: { variant: { control: 'inline-radio', options: ['row', 'tile'] } },
  args: {
    icon: iconMail,
    label: 'Email',
    value: 'hello@example.com',
    href: 'mailto:hello@example.com',
    copy: true,
    variant: 'row',
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-contact-method [icon]="icon" [label]="label" [value]="value" [href]="href" [copy]="copy" [variant]="variant" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<ContactMethod>;

export const Row: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'hello@example.com' })).toBeVisible();
  },
};

export const Tiles: Story = {
  render: () => ({
    props: { mail: iconMail, phone: iconPhone, clock: iconClock },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap-sm); max-width: 720px">
        <fm-contact-method variant="tile" [icon]="mail" label="Email" value="hello@example.com" href="mailto:hello@example.com" />
        <fm-contact-method variant="tile" [icon]="phone" label="Phone" value="+234 706 678 0373" href="tel:+2347066780373" />
        <fm-contact-method variant="tile" [icon]="clock" label="Replies" value="Within 24 hours" />
      </div>`,
  }),
};
