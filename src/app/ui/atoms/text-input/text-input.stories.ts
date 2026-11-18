import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { iconMail } from '../icon/icons';
import { TextInput } from './text-input';

/** A single-line text box. FormField (ETE-74) adds the label, hint and error. */
const meta: Meta<TextInput> = {
  title: 'Atoms/TextInput',
  component: TextInput,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    type: { control: 'select', options: ['text', 'email', 'tel', 'url', 'search', 'password'] },
  },
  args: {
    ariaLabel: 'Email',
    type: 'email',
    placeholder: 'you@company.com',
    autocomplete: 'email',
    size: 'md',
    invalid: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<TextInput>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await userEvent.type(input, 'ada@example.com');
    await expect(input).toHaveValue('ada@example.com');
  },
};

export const WithIcon: Story = { args: { leadingIcon: iconMail } };

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--gap-sm); max-width: 320px">
        <fm-text-input ariaLabel="Small" size="sm" placeholder="Small" />
        <fm-text-input ariaLabel="Medium" placeholder="Medium" />
        <fm-text-input ariaLabel="Large" size="lg" placeholder="Large" />
        <fm-text-input ariaLabel="Extra large" size="xl" placeholder="Extra large" />
      </div>`,
  }),
};
