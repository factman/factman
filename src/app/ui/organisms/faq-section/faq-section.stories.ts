import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { FaqSection } from './faq-section';

/** Questions clients ask first: the header beside the answers, each a disclosure; the first open. */
const meta: Meta<FaqSection> = {
  title: 'Organisms/FaqSection',
  component: FaqSection,
  parameters: { layout: 'fullscreen' },
  args: {
    description: 'Something else on your mind? Ask on the call, or send it by email.',
    items: [
      {
        question: 'How much does it cost?',
        answer: 'Every engagement is quoted after the discovery call.',
      },
      {
        question: 'Do you work with teams outside Nigeria?',
        answer: 'Yes. I work remotely from Lagos (WAT, UTC+1).',
      },
      {
        question: 'Can you join an existing team?',
        answer: 'Yes. Software Engineering as a Service is designed for that.',
      },
      {
        question: 'Who owns the code?',
        answer: 'You do. Code, accounts and documentation are handed over.',
      },
    ],
  },
};
export default meta;

type Story = StoryObj<FaqSection>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    const second = canvas.getByRole('button', { name: /outside Nigeria/ });
    await userEvent.click(second);
    await expect(second).toHaveAttribute('aria-expanded', 'true');
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
