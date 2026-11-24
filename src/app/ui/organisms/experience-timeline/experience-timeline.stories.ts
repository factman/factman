import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { ExperienceTimeline, type TimelineEntry, type TimelineGlance } from './experience-timeline';

const ENTRIES: TimelineEntry[] = [
  {
    id: 'simple-finance',
    organization: 'Simple Finance',
    website: 'https://simplefinance.ng',
    logo: '/assets/clients/simple-finance.png',
    total: '4 yrs 3 mos · 2 roles',
    roles: [
      {
        id: 'sf-cto',
        title: 'Chief Technology Officer',
        period: 'Jan 2024 – Present',
        duration: '2 yrs 11 mos',
        location: 'Lagos, Nigeria',
        type: 'Full-time',
        summary: "Lead the technology team and the company's technology strategy.",
        highlights: [
          'Led the team that implemented solutions to improve efficiency and profitability',
          'Set the technology strategy, including selecting and deploying new systems and infrastructure',
          'Run technology projects to deadline and budget with senior leadership',
        ],
        skills: ['Angular', 'Node.js', 'TypeScript'],
        current: true,
      },
      {
        id: 'sf-cto-first',
        title: 'Chief Technology Officer',
        period: 'Dec 2021 – Jan 2023',
        duration: '1 yr 2 mos',
        summary: 'First term as CTO.',
        highlights: [],
        skills: [],
        current: false,
      },
    ],
  },
  {
    id: 'mazadat',
    organization: 'Mazadat',
    website: 'https://www.mazad.at',
    logo: '/assets/clients/mazadat.svg',
    logoDark: true,
    total: '1 yr · 2 roles',
    roles: [
      {
        id: 'mz-lead',
        title: 'Frontend Lead Engineer',
        period: 'Oct 2023 – Mar 2024',
        duration: '6 mos',
        location: 'Cairo, Egypt',
        summary: 'Frontend strategy and technical leadership.',
        highlights: [
          'Drove frontend strategy, technical leadership, mentoring and onboarding',
          'Worked with cross-functional teams to streamline development',
        ],
        skills: ['React', 'Elasticsearch', 'Azure'],
        current: false,
      },
    ],
  },
  {
    id: 'nano',
    organization: 'Nano Blockchain',
    roles: [
      {
        id: 'nano-dev',
        title: 'Software Engineer',
        period: 'Jan 2018 – Dec 2018',
        duration: '1 yr',
        summary: 'Blockchain dashboards.',
        highlights: ['Built the wallet dashboard'],
        skills: ['JavaScript'],
        current: false,
      },
    ],
  },
];

const GLANCE: TimelineGlance = {
  roles: [
    { title: 'Chief Technology Officer', description: 'Simple Finance · since Jan 2024' },
    { title: 'CTO & Co-Founder', description: 'ETeam Technology · since May 2017' },
  ],
  stats: [
    { value: 13, suffix: '+', label: 'years since 2013' },
    { value: 10, label: 'organizations' },
    { value: 12, label: 'roles' },
    { value: 2, label: 'current roles' },
  ],
  resumeHref: '#resume',
};

/**
 * The Experience section's body: organizations on a logo rail with their roles newest first,
 * durations and "Present", highlights that expand with "Show more", skills as chips, and
 * CareerGlance beside it. The page wraps it in SectionLayout (`#experience`).
 */
const meta: Meta<ExperienceTimeline> = {
  title: 'Organisms/ExperienceTimeline',
  component: ExperienceTimeline,
  parameters: { layout: 'padded' },
  args: { entries: ENTRIES, glance: GLANCE },
};
export default meta;

type Story = StoryObj<ExperienceTimeline>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvas }) => {
    const more = canvas.getByRole('button', { name: /Show 1 more/ });
    await userEvent.click(more);
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(more);
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };

/** The timeline alone, without CareerGlance. */
export const TimelineOnly: Story = { args: { glance: undefined } };
