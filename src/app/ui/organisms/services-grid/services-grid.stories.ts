import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { provideIcons } from '@ui/atoms/icon/icon-registry';
import { SERVICE_ICONS } from '@ui/molecules/service-card/service-icons';

import { type GridService, ServicesGrid } from './services-grid';

const deliverables: GridService['deliverables'] = [
  'Discovery call',
  'Written recommendations',
  'Architecture review',
  'Follow-up',
];
const SERVICES: GridService[] = [
  [
    'consultancy',
    'Consultancy',
    'Independent advice on architecture, product and technology choices before you commit budget.',
    'lightbulb',
  ],
  [
    'software-engineering-as-a-service',
    'Software Engineering as a Service',
    'A senior engineer embedded in your team for features, fixes and delivery.',
    'code',
  ],
  [
    'fintech-and-payment-solutions',
    'Fintech and payment solutions',
    'Payment flows, wallets and ledgers that are secure and reconcile.',
    'credit-card',
  ],
  [
    'technical-leadership',
    'Technical leadership',
    'Fractional CTO support for founders who need a senior technical partner.',
    'users',
  ],
  [
    'devops',
    'DevOps',
    'CI/CD pipelines and containers so your team ships safely every day.',
    'workflow',
  ],
  [
    'cloud-engineering-services',
    'Cloud engineering services',
    'Infrastructure on AWS, Google Cloud or Azure, sized for your traffic.',
    'cloud',
  ],
  [
    'mobile-development',
    'Mobile development',
    'Cross-platform apps for iOS and Android, from prototype to store release.',
    'mobile',
  ],
  [
    'custom-tailored-software-solutions',
    'Custom tailored software solutions',
    'Software built around how your business works, from first sketch to production.',
    'wrench',
  ],
].map(([slug, title, summary, icon]) => ({ slug, title, summary, icon, deliverables }));

/**
 * The services as ServiceTiles in a grid of four, linking to `/services/:slug`, with "Compare all
 * services" under them on the home page. With `current`, the other services after that one
 * ("Often booked together" on a service's page).
 */
const meta: Meta<ServicesGrid> = {
  title: 'Organisms/ServicesGrid',
  component: ServicesGrid,
  decorators: [applicationConfig({ providers: [provideRouter([]), provideIcons(SERVICE_ICONS)] })],
  parameters: { layout: 'padded' },
  args: { services: SERVICES, ctaLabel: 'Compare all services' },
};
export default meta;

type Story = StoryObj<ServicesGrid>;

export const Home: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(8);
    await expect(canvas.getByRole('link', { name: /Compare all services/ })).toBeVisible();
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

/** On a service's page: the next four, without the call to action. */
export const Related: Story = {
  args: { current: 'devops', limit: 4, ctaLabel: undefined },
  play: async ({ canvas }) => {
    const titles = canvas.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
    await expect(titles[0]).toBe('Cloud engineering services');
  },
};
