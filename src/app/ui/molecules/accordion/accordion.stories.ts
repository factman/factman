import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { Accordion } from './accordion';

/** Questions and answers (the FAQ). */
const meta: Meta<Accordion> = {
  title: 'Molecules/Accordion',
  component: Accordion,
  args: {
    items: [
      {
        id: 'cost',
        title: 'How much does a project cost?',
        content: 'It depends on the scope. After a short call I send a fixed quote.',
      },
      {
        id: 'time',
        title: 'How long does a project take?',
        content: 'Most projects take between 4 and 12 weeks from the first call to launch.',
      },
      {
        id: 'after',
        title: 'Do you support the product after launch?',
        content: 'Yes, with a monthly retainer for fixes, updates and new features.',
      },
    ],
    multiple: false,
    expanded: ['cost'],
  },
};
export default meta;

type Story = StoryObj<Accordion>;

export const Faq: Story = {
  play: async ({ canvas }) => {
    const time = canvas.getByRole('button', { name: 'How long does a project take?' });
    await userEvent.click(time);
    await expect(time).toHaveAttribute('aria-expanded', 'true');
  },
};

export const Multiple: Story = { args: { multiple: true, expanded: ['cost', 'time'] } };
