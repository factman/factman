import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { Checkbox } from './checkbox';

/** A checkbox with its label beside it. */
const meta: Meta<Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  argTypes: { size: { control: 'inline-radio', options: [16, 20] } },
  args: { label: 'I agree to the privacy policy', size: 20, invalid: false, disabled: false },
};
export default meta;

type Story = StoryObj<Checkbox>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'I agree to the privacy policy' });
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

export const WithDescription: Story = {
  args: { label: 'Analytics', description: 'Anonymous page views, no personal data' },
};

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Small: Story = { args: { size: 16 } };
