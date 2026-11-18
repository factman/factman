import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { iconClock, iconCode } from '@ui/atoms';

import { SelectableCard } from './selectable-card';

/** A card the visitor picks; a real radio (or checkbox) underneath. */
const meta: Meta<SelectableCard> = {
  title: 'Molecules/SelectableCard',
  component: SelectableCard,
  render: () => {
    const picked = signal('discovery');
    return {
      props: { picked, clock: iconClock, code: iconCode },
      template: `
        <div role="radiogroup" aria-label="Kind of call" style="display: flex; flex-direction: column; gap: var(--gap-sm); max-width: 380px">
          <fm-selectable-card name="call" value="discovery" title="Discovery call" description="30 minutes about your goals" [icon]="clock" [selected]="picked() === 'discovery'" (selectedChange)="picked.set('discovery')" />
          <fm-selectable-card name="call" value="review" title="Code review" description="60 minutes on your codebase" [icon]="code" [selected]="picked() === 'review'" (selectedChange)="picked.set('review')" />
        </div>`,
    };
  },
};
export default meta;

export const RadioGroup: StoryObj<SelectableCard> = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Code review'));
    await expect(canvas.getByRole('radio', { name: 'Code review' })).toBeChecked();
  },
};
