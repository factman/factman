import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { TextArea } from './text-area';

/** A multi-line text box, such as the contact form's message. */
const meta: Meta<TextArea> = {
  title: 'Atoms/TextArea',
  component: TextArea,
  args: {
    ariaLabel: 'Message',
    placeholder: 'Tell me about your project',
    rows: 4,
    maxLength: 2000,
    invalid: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<TextArea>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const area = canvas.getByRole('textbox', { name: 'Message' });
    await userEvent.type(area, 'We need a new payments dashboard.');
    await expect(area).toHaveValue('We need a new payments dashboard.');
  },
};

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };
