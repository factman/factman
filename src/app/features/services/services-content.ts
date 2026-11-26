import type { FaqItem } from '@ui/organisms/faq-section/faq-section';
import type { Step } from '@ui/molecules/stepper/stepper';

/**
 * The Services page's own copy (the canvas's Services page). Each service has its own process and
 * FAQ in services.json; these are the general ones for the catalogue.
 */

/** The same four steps for every engagement. */
export const ENGAGEMENT_STEPS: readonly Step[] = [
  { title: 'Discovery call', description: '30 minutes on goals, constraints and timeline' },
  { title: 'Written quote', description: 'Scope, deliverables and engagement model' },
  { title: 'Build in sprints', description: 'Weekly demos and progress notes' },
  { title: 'Handover', description: 'Docs, access and a support window' },
];

/** Questions clients ask before choosing a service. */
export const SERVICES_FAQ: readonly FaqItem[] = [
  {
    question: 'How much does it cost?',
    answer:
      'Every engagement is quoted after the discovery call, based on scope and duration, so the site shows "Get a quote" instead of fixed prices.',
  },
  {
    question: 'Do you work with teams outside Nigeria?',
    answer:
      'Yes. I work remotely from Lagos (WAT, UTC+1) and have worked with teams in Egypt and elsewhere.',
  },
  {
    question: 'Can you join an existing team?',
    answer:
      'Yes. Software Engineering as a Service and Technical leadership are designed for that.',
  },
  {
    question: 'Who owns the code?',
    answer:
      'You do. Code, accounts and documentation are handed over at the end of the engagement.',
  },
];
