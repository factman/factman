/**
 * The home page's sections, in page order: each `id` is an anchor (`/#about`) used by the
 * navigation in site.json. `#resume` sits inside About in the design.
 */
export const HOME_SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'resume', label: 'Résumé' },
  { id: 'stack', label: 'Stack' },
  { id: 'experience', label: 'Experience' },
  { id: 'services', label: 'Services', route: '/services' },
  { id: 'projects', label: 'Projects', route: '/projects' },
  { id: 'stats', label: 'Stats' },
  { id: 'blog', label: 'Blog', route: '/blog' },
  { id: 'contact', label: 'Contact' },
] as const;
