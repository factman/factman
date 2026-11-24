import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';

import { IconButton } from '../icon-button/icon-button';
import { iconCopy } from '../icon/icons';
import { Tooltip } from './tooltip';

/** A short label shown on hover and keyboard focus; Escape closes it. */
const meta: Meta<Tooltip> = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  decorators: [moduleMetadata({ imports: [Tooltip, IconButton] })],
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  args: { placement: 'top' },
  render: (args) => ({
    props: { ...args, icon: iconCopy },
    template: `
      <div style="padding: var(--padding-4xl); text-align: center">
        <span fmTooltip="Copy email" [placement]="placement" style="display: inline-flex">
          <fm-icon-button [icon]="icon" label="Copy" variant="secondary" />
        </span>
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<Tooltip>;

export const OnFocus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Copy' })).toHaveFocus();
    const body = within(document.body);
    const tip = await body.findByRole('tooltip');
    await expect(tip).toHaveTextContent('Copy email');
    // In the top layer as a popover where the browser has them (ETE-249).
    if (typeof tip.showPopover === 'function')
      await expect(tip.matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('tooltip')).toBeNull();
  },
};

export const Bottom: Story = { args: { placement: 'bottom' } };
