import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { ScheduleCallButton } from './schedule-call-button';

/** "Schedule a call": asks the page to open the scheduler. */
const meta: Meta<ScheduleCallButton> = {
  title: 'Molecules/ScheduleCallButton',
  component: ScheduleCallButton,
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'tertiary', 'link'] },
  },
  args: {
    label: 'Schedule a call',
    variant: 'primary',
    size: 'lg',
    full: false,
    service: 'Consultancy',
    schedule: fn(),
  },
};
export default meta;

export const Default: StoryObj<ScheduleCallButton> = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Schedule a call' }));
    await expect(args.schedule).toHaveBeenCalledWith('Consultancy');
  },
};
