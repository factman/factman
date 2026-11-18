import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { MainLayout } from './main-layout';

const block = (label: string, height: number) =>
  `<div style="box-sizing: border-box; height: ${height}px; margin: var(--gap-md); padding: var(--padding-md); border: var(--border-width-sm) dashed var(--border-focus); border-radius: var(--radius-sm); font: 500 12px/16px var(--font-mono); color: var(--text-secondary); background: var(--glass-fill)">${label}</div>`;

/** The page frame (canvas TemplateMain): skip link, header, main, footer, overlays. */
const meta: Meta<MainLayout> = {
  title: 'Templates/MainLayout',
  component: MainLayout,
  parameters: { layout: 'fullscreen' },
  render: () => ({
    template: `
      <fm-main-layout>
        <header layoutHeader>${block('slot · header (SiteHeader)', 88)}</header>
        ${block('slot · main: hero, sections …', 480)}
        <footer layoutFooter>${block('slot · footer (SiteFooter)', 200)}</footer>
        <div layoutOverlays>${block('slot · overlays (consent, dialogs)', 64)}</div>
      </fm-main-layout>`,
  }),
};
export default meta;

type Story = StoryObj<MainLayout>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    const skip = canvas.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('main')).toHaveFocus();
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };

export const MobileDark: Story = { globals: { theme: 'dark', viewport: { value: 'mobile' } } };
