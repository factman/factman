import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { SectionLayout } from './section-layout';

const card = `<div style="box-sizing: border-box; height: 160px; padding: var(--padding-md); border: var(--border-width-sm) dashed var(--border-focus); border-radius: var(--radius-lg); font: 500 12px/16px var(--font-mono); color: var(--text-secondary); background: var(--glass-fill)">slot · body</div>`;

/** One page section: anchor, scroll-spy, numbered header, body that reveals on scroll. */
const meta: Meta<SectionLayout> = {
  title: 'Templates/SectionLayout',
  component: SectionLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    sectionId: 'services',
    index: '04',
    eyebrow: 'Services',
    title: 'What I can build for you',
    description: 'Web and mobile products, payment systems, and the cloud they run on.',
    level: 2,
    align: 'start',
    tight: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <fm-section-layout [sectionId]="sectionId" [index]="index" [eyebrow]="eyebrow" [title]="title" [description]="description" [level]="level" [align]="align" [tight]="tight">
        <a sectionAction href="#services" style="font: 500 14px/20px var(--font-sans); color: var(--accent-default)">All services</a>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--gap-xl)">${card}${card}${card}</div>
      </fm-section-layout>`,
  }),
};
export default meta;

type Story = StoryObj<SectionLayout>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'What I can build for you' })).toHaveAttribute(
      'id',
      'services',
    );
  },
};

export const Centered: Story = { args: { align: 'center' } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
