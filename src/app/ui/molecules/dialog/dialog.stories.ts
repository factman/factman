import { signal } from '@angular/core';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@ui/atoms/button/button';

import { Dialog } from './dialog';

/** A modal dialog: focus stays inside, Escape closes it, the page doesn't scroll. */
const meta: Meta<Dialog> = {
  title: 'Molecules/Dialog',
  component: Dialog,
  decorators: [moduleMetadata({ imports: [Button] })],
  args: { label: 'Web résumé', description: 'Two pages, as a PDF', size: 'md' },
  render: (args) => {
    const open = signal(false);
    return {
      props: { ...args, open },
      template: `
        <fm-button variant="secondary" (pressed)="open.set(true)">Preview résumé</fm-button>
        <fm-dialog [open]="open()" [label]="label" [description]="description" [size]="size" (closed)="open.set(false)">
          <p style="margin: 0">Fullstack engineer and CTO with 12+ years of experience building web, mobile and payment products.</p>
          <div dialogFooter style="display: flex; gap: var(--gap-xs)">
            <fm-button variant="secondary" (pressed)="open.set(false)">Done</fm-button>
            <fm-button>Download PDF</fm-button>
          </div>
        </fm-dialog>`,
    };
  },
};
export default meta;

export const OpenAndClose: StoryObj<Dialog> = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Preview résumé' }));
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Web résumé' });
    // It fades in, so wait for the end of the opening animation.
    await waitFor(() => expect(dialog).toBeVisible());
    // Escape fires the dialog's native cancel event, which a simulated key press doesn't (the unit
    // spec covers cancel); the close button takes the same path.
    await userEvent.click(body.getByRole('button', { name: 'Close' }));
    // It fades out too (display and overlay transition: ETE-252), then the browser puts focus
    // back on the button that opened it.
    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Preview résumé' })).toHaveFocus();
  },
};
