import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { Chip, type ChipToggle } from './chip';

/** A compact option: a toggle with `aria-pressed`, or static text. */
const meta: Meta<Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] } },
  args: { size: 'md', disabled: false },
};
export default meta;

type Story = StoryObj<Chip>;

export const Static: Story = {
  render: (args) => ({
    props: args,
    template: `<fm-chip [size]="size">Fintech</fm-chip>`,
  }),
};

/** A filter bar's chips: the parent owns which are selected. */
export const Toggles: Story = {
  render: (args) => {
    const selected = signal(new Set(['web']));
    return {
      props: {
        ...args,
        options: ['web', 'mobile', 'devops'],
        selected,
        onToggle: ({ value, selected: on }: ChipToggle) =>
          selected.update((s) => {
            const next = new Set(s);
            if (on) next.add(value ?? '');
            else next.delete(value ?? '');
            return next;
          }),
      },
      template: `
        <span style="display: inline-flex; gap: var(--gap-xs)">
          @for (o of options; track o) {
            <fm-chip [size]="size" [value]="o" [selected]="selected().has(o)" [disabled]="disabled" (toggled)="onToggle($event)">{{ o }}</fm-chip>
          }
        </span>`,
    };
  },
  play: async ({ canvas }) => {
    const mobile = canvas.getByRole('button', { name: 'mobile', pressed: false });
    await userEvent.click(mobile);
    await expect(canvas.getByRole('button', { name: 'mobile', pressed: true })).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    props: args,
    template: `<fm-chip [selected]="false" [disabled]="disabled">Web</fm-chip>`,
  }),
};
