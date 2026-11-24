import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { ProcessSection } from './process-section';

/** How an engagement runs: the steps across a glass panel, which scrolls sideways on phones. */
const meta: Meta<ProcessSection> = {
  title: 'Organisms/ProcessSection',
  component: ProcessSection,
  parameters: { layout: 'padded' },
  args: {
    label: 'How an engagement runs',
    steps: [
      { title: 'Discovery call', description: '30 minutes on goals, constraints and timeline' },
      { title: 'Written quote', description: 'Scope, deliverables and engagement model' },
      { title: 'Build in sprints', description: 'Weekly demos and progress notes' },
      { title: 'Handover', description: 'Docs, access and a support window' },
    ],
  },
};
export default meta;

type Story = StoryObj<ProcessSection>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
