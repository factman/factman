import type { Project } from '@shared';

/** Sample projects for the ProjectCard spec and stories. */
export const PUBLIC_PROJECT: Project = {
  id: 'investa',
  slug: 'investa',
  title: 'Investa.ng',
  summary: 'An investment platform for Nigerian savers: wallets, portfolios and payouts.',
  category: 'Fintech',
  status: 'completed',
  visibility: 'public',
  featured: true,
  stack: ['Angular', 'Node.js', 'PostgreSQL'],
  startedAt: '2021-03',
  completedAt: '2022-08',
  links: { live: 'https://investa.ng', source: 'https://github.com/factman/investa' },
};

export const PRIVATE_PROJECT: Project = {
  ...PUBLIC_PROJECT,
  id: 'ledger',
  slug: 'ledger',
  title: 'Simple Finance ledger',
  status: 'in-progress',
  visibility: 'private',
  featured: false,
  completedAt: undefined,
  links: {},
  engage: { mode: 'request-demo', note: 'Client work under NDA; a demo is available on request.' },
};
