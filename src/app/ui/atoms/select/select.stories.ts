import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { Select } from './select';

/** A native drop-down styled as a design-system field. */
const meta: Meta<Select> = {
  title: 'Atoms/Select',
  component: Select,
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] } },
  args: {
    ariaLabel: 'Service',
    placeholder: 'Choose a service',
    options: [
      { value: 'web', label: 'Web app' },
      { value: 'mobile', label: 'Mobile app' },
      { value: 'devops', label: 'DevOps and cloud' },
    ],
    size: 'md',
    invalid: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<Select>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Service' });
    await userEvent.selectOptions(select, 'mobile');
    await expect(select).toHaveValue('mobile');
  },
};

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };
