import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { MainLayout } from './main-layout';

const block = (label: string, height: number) =>
  `<div style="box-sizing: border-box; height: ${height}px; margin: var(--gap-md); padding: var(--padding-md); border: var(--border-width-sm) dashed var(--border-focus); border-radius: var(--radius-sm); font: 500 12px/16px var(--font-mono); color: var(--text-secondary); background: var(--glass-fill)">${label}</div>`;

/**
 * The page frame (canvas TemplateMain): header, page, footer, overlays. The app shell's skip link
 * and `<main>` go in the content slot (ETE-262).
 */
const meta: Meta<MainLayout> = {
  title: 'Templates/MainLayout',
  component: MainLayout,
  parameters: { layout: 'fullscreen' },
  render: () => ({
    template: `
      <fm-main-layout>
        <header layoutHeader>${block('slot · header (SiteHeader)', 88)}</header>
        <main id="main" tabindex="-1">${block('slot · main: hero, sections …', 480)}</main>
        <footer layoutFooter>${block('slot · footer (SiteFooter)', 200)}</footer>
        <div layoutOverlays>${block('slot · overlays (consent, dialogs)', 64)}</div>
      </fm-main-layout>`,
  }),
};
export default meta;

type Story = StoryObj<MainLayout>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    // One main landmark: the projected one.
    await expect(canvas.getAllByRole('main')).toHaveLength(1);
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };

export const MobileDark: Story = { globals: { theme: 'dark', viewport: { value: 'mobile' } } };
