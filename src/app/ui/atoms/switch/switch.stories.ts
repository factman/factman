import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { Switch } from './switch';

/** An on/off switch for settings that apply at once. */
const meta: Meta<Switch> = {
  title: 'Atoms/Switch',
  component: Switch,
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: { label: 'Analytics cookies', size: 'md', invalid: false, disabled: false },
};
export default meta;

type Story = StoryObj<Switch>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const sw = canvas.getByRole('switch', { name: 'Analytics cookies' });
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  },
};

export const WithDescription: Story = {
  args: { description: 'Anonymous page views, no personal data' },
};

export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--gap-sm)">
        <fm-switch label="Small" size="sm" />
        <fm-switch label="Medium" />
        <fm-switch label="Large" size="lg" />
      </div>`,
  }),
};
