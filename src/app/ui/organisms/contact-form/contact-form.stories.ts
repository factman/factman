import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { ContactForm } from './contact-form';

/**
 * "Send a message": checked on submit with inline errors, then the drafted email is shown ready
 * with "Open mail app", "Open in Gmail", "Copy message" and "Edit message". No backend.
 */
const meta: Meta<ContactForm> = {
  title: 'Organisms/ContactForm',
  component: ContactForm,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'padded' },
  args: {
    email: 'hello@example.com',
    topics: ['General enquiry', 'Consultancy', 'DevOps', 'Mobile development', 'Résumé request'],
  },
};
export default meta;

type Story = StoryObj<ContactForm>;

export const Empty: Story = {};

export const Errors: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Compose email/ }));
    await expect(canvas.getByText('Enter your name')).toBeVisible();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
