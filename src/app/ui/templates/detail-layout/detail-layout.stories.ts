import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { DetailLayout } from './detail-layout';

const slot = (label: string, height: number) =>
  `<div style="box-sizing: border-box; height: ${height}px; padding: var(--padding-md); border: var(--border-width-sm) dashed var(--border-focus); border-radius: var(--radius-lg); font: 500 12px/16px var(--font-mono); color: var(--text-secondary); background: var(--glass-fill)">${label}</div>`;

/** The service and project detail pages (canvas TemplateDetail). */
const meta: Meta<DetailLayout> = {
  title: 'Templates/DetailLayout',
  component: DetailLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    crumbs: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Consultancy' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <fm-detail-layout [crumbs]="crumbs">
        <div detailHero>${slot('slot · hero: title, lead, actions', 320)}</div>
        <div detailBody>${slot('slot · body: who it is for, deliverables, process, FAQ', 900)}</div>
        <div detailAside>${slot('slot · aside: BookingCard / EngageCard (sticky)', 460)}</div>
        <div detailCta>${slot('slot · cta', 120)}</div>
        <div detailRelated>${slot('slot · related services', 240)}</div>
      </fm-detail-layout>`,
  }),
};
export default meta;

type Story = StoryObj<DetailLayout>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };

export const MobileDark: Story = { globals: { theme: 'dark', viewport: { value: 'mobile' } } };
