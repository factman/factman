import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { SkillChip } from './skill-chip';

/** A skill in monospace, with years of use when known. */
const meta: Meta<SkillChip> = {
  title: 'Atoms/SkillChip',
  component: SkillChip,
  args: { label: 'Angular', years: 8 },
};
export default meta;

type Story = StoryObj<SkillChip>;

export const WithYears: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('8 yrs', { exact: false })).toBeInTheDocument();
  },
};

export const NameOnly: Story = { args: { label: 'Docker', years: undefined } };

export const Group: Story = {
  render: () => ({
    template: `
      <span style="display: inline-flex; flex-wrap: wrap; gap: var(--gap-xs)">
        <fm-skill-chip label="TypeScript" [years]="10" />
        <fm-skill-chip label="Angular" [years]="8" />
        <fm-skill-chip label="React Native" [years]="1" />
        <fm-skill-chip label="Kubernetes" />
      </span>`,
  }),
};
