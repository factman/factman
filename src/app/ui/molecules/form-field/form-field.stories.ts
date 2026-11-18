import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Select, TextArea, TextInput } from '@ui/atoms';

import { FormField } from './form-field';

/** A control with its label, hint and error; the control inside is linked to them by itself. */
const meta: Meta<FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  decorators: [moduleMetadata({ imports: [TextInput, TextArea, Select] })],
  args: { label: 'Email', hint: "I'll only use it to reply", error: '', required: true },
  render: (args) => ({
    props: args,
    // Fields sit on the contact form's glass card in the app.
    template: `
      <div style="max-width: 360px; padding: var(--padding-xl); border-radius: var(--radius-xl); background: var(--glass-fill-strong)">
        <fm-form-field [label]="label" [hint]="hint" [error]="error" [required]="required">
          <fm-text-input type="email" autocomplete="email" placeholder="you@company.com" />
        </fm-form-field>
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<FormField>;

export const WithHint: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /Email/ });
    await expect(input).toHaveAccessibleDescription("I'll only use it to reply");
  },
};

export const WithError: Story = {
  args: { error: 'Enter an email address like name@example.com' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: /Email/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

/** The contact form's fields. */
export const ContactForm: Story = {
  render: () => ({
    props: {
      services: [
        { value: 'web', label: 'Web app' },
        { value: 'mobile', label: 'Mobile app' },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--gap-md); max-width: 420px">
        <fm-form-field label="Name" [required]="true"><fm-text-input autocomplete="name" /></fm-form-field>
        <fm-form-field label="Service"><fm-select placeholder="Choose one" [options]="services" /></fm-form-field>
        <fm-form-field label="Message" hint="A few lines about the project" [required]="true"><fm-text-area [rows]="5" /></fm-form-field>
      </div>`,
  }),
};
