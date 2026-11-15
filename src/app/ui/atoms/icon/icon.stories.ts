import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Icon } from './icon';
import type { IconDef } from './icon-def';
import * as icons from './icons';
import { iconArrowRight, iconGithub, iconLinkedin, iconMedium, iconWhatsapp, iconX } from './icons';

// The gallery is the one place that imports every icon; components import only what they use.
const ALL: IconDef[] = Object.values(icons).filter(
  (v): v is IconDef => typeof v === 'object' && v !== null && 'd' in v,
);

/** Icons from the design system's set, drawn in the current text colour (ADR-004). */
const meta: Meta<Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  argTypes: {
    size: { control: 'inline-radio', options: [16, 20, 24] },
    label: { control: 'text' },
  },
  args: { icon: iconArrowRight, size: 24 },
};
export default meta;

type Story = StoryObj<Icon>;

/** Decorative: hidden from assistive tech, next to text that says the same. */
export const Decorative: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg.fm-icon');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
  },
};

/** Labelled: an image with a name, for an icon that stands alone. */
export const Labelled: Story = {
  args: { icon: iconGithub, label: 'GitHub' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'GitHub' })).toBeVisible();
  },
};

/** 16 inline with small text, 20 in controls, 24 on its own. */
export const Sizes: Story = {
  render: () => ({
    props: { icon: iconArrowRight },
    template: `
      <span style="display: inline-flex; gap: var(--gap-md); align-items: center; color: var(--icon-secondary)">
        <fm-icon [icon]="icon" [size]="16" /><fm-icon [icon]="icon" [size]="20" /><fm-icon [icon]="icon" [size]="24" />
      </span>`,
  }),
};

/** Filled brand marks, used by the social links. */
export const Brand: Story = {
  render: () => ({
    props: { brands: [iconGithub, iconLinkedin, iconMedium, iconX, iconWhatsapp] },
    template: `
      <span style="display: inline-flex; gap: var(--gap-md); color: var(--icon-primary)">
        @for (b of brands; track b.name) { <fm-icon [icon]="b" [label]="b.name" /> }
      </span>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img')).toHaveLength(5);
  },
};

/** Every icon in the set, with its name. */
export const Gallery: Story = {
  render: () => ({
    props: { all: ALL },
    template: `
      <ul style="display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: var(--gap-sm); margin: 0; padding: 0; list-style: none; font: 400 12px/16px var(--font-mono); color: var(--text-secondary)">
        @for (i of all; track i.name) {
          <li style="display: flex; flex-direction: column; align-items: center; gap: var(--gap-xs); padding: var(--padding-sm); border-radius: var(--radius-md); background: var(--glass-fill)">
            <span style="color: var(--icon-primary)"><fm-icon [icon]="i" /></span>{{ i.name }}
          </li>
        }
      </ul>`,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('svg.fm-icon')).toHaveLength(ALL.length);
  },
};
