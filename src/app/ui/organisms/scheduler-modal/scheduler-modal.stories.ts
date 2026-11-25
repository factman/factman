import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { SchedulerModal } from './scheduler-modal';

/**
 * "Schedule a call": the Google Calendar appointment schedule in the shared Dialog, with a loading
 * state and "Open in a new tab". The page owns `open`. The story frames a blank page instead of
 * the real calendar (only Google Calendar URLs are framed, so it shows the loading state).
 */
const meta: Meta<SchedulerModal> = {
  title: 'Organisms/SchedulerModal',
  component: SchedulerModal,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    open: true,
    service: 'DevOps',
    src: 'about:blank',
    fallbackUrl: 'https://calendar.app.google/example',
  },
};
export default meta;

type Story = StoryObj<SchedulerModal>;

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.ownerDocument.querySelector('dialog')!;
    await expect(dialog.open).toBe(true);
    await expect(dialog.textContent).toContain('About DevOps');
  },
};

export const General: Story = { args: { service: undefined } };
