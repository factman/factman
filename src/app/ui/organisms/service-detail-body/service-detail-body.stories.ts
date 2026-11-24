import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { type DetailService, ServiceDetailBody } from './service-detail-body';

const SERVICE: DetailService = {
  title: 'DevOps',
  audience:
    'Teams that ship by hand or on a fragile pipeline and want every change tested, built and deployed the same way, every day.',
  deliverables: [
    'CI/CD pipelines with automated tests and checks',
    'Docker images and environment setup',
    'Infrastructure as code where it fits',
    'Monitoring, logs and alerts',
  ],
  process: [
    { step: 1, title: 'Audit', description: 'How you build, test and ship today.' },
    { step: 2, title: 'Plan', description: 'A pipeline and environments that fit your team.' },
    { step: 3, title: 'Build', description: 'Pipelines, images and infrastructure as code.' },
    { step: 4, title: 'Handover', description: 'Docs and a walkthrough for the team.' },
  ],
  engagement: [
    { id: 'setup', title: 'Pipeline setup', description: 'A one-off build of your pipeline.' },
    { id: 'retainer', title: 'Retainer', description: 'Ongoing care for pipelines and infra.' },
    { id: 'workshop', title: 'Workshop', description: 'A session on one problem.' },
  ],
  faq: [
    {
      question: 'Which CI do you use?',
      answer: 'Whatever your team already has: GitHub Actions, GitLab, Azure DevOps or Jenkins.',
    },
    {
      question: 'Do you need production access?',
      answer: 'Only what the work needs, granted and revoked by you.',
    },
  ],
  booking: {
    schedulerUrl: 'https://calendar.app.google/example',
    email: 'mailto:hello@example.com?subject=Quote%20request%3A%20DevOps',
    whatsapp: 'https://wa.me/2347066780373',
    phone: 'tel:+2347066780373',
  },
  pricing: { model: 'quote', label: 'Get a quote' },
};

/**
 * The body of a service's page: who it is for, deliverables, how I work, engagement models and
 * the FAQ, beside the sticky BookingCard.
 */
const meta: Meta<ServiceDetailBody> = {
  title: 'Organisms/ServiceDetailBody',
  component: ServiceDetailBody,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'padded' },
  args: {
    service: SERVICE,
    person: {
      name: 'Odunayo Mohammed',
      meta: 'Fullstack Software Engineer and CTO · Lagos, WAT (UTC+1)',
    },
  },
};
export default meta;

type Story = StoryObj<ServiceDetailBody>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(5);
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
