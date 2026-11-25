import type {
  Contact,
  Organization,
  Profile,
  Project,
  Resume,
  Skill,
  TerminalCommand,
} from '@shared';
import { sortExperience, yearsSince } from '@shared';

/** What the terminal's commands read: the site's data files, and the theme hook. */
export interface TerminalSources {
  profile: Pick<
    Profile,
    'name' | 'headline' | 'summary' | 'location' | 'careerStart' | 'availability'
  >;
  experience: readonly Organization[];
  skills: readonly Pick<Skill, 'name' | 'category'>[];
  projects: readonly Pick<Project, 'title' | 'slug' | 'status' | 'visibility' | 'startedAt'>[];
  contact: Pick<Contact, 'email' | 'links' | 'city' | 'country'>;
  resumes: readonly Pick<Resume, 'id' | 'title'>[];
  /** ThemeService.command: `theme`, `theme dark` … */
  theme: (arg: string) => string;
  now: Date;
}

/** Two columns: labels padded to the longest one. */
const columns = (rows: readonly (readonly [string, string])[]): string => {
  const width = Math.max(...rows.map(([label]) => label.length));
  return rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`).join('\n');
};

const STATUS: Readonly<Record<string, string>> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  maintained: 'Maintained',
  archived: 'Archived',
};

/**
 * The terminal's commands (FR-36), every answer read from the data files as plain text:
 * about, skills, projects, contact, resume and theme. `help` and `clear` are built in.
 */
export function terminalCommands(src: TerminalSources): TerminalCommand[] {
  const { profile, contact } = src;
  return [
    {
      name: 'about',
      summary: 'Who Odunayo is',
      run: () => {
        const company = sortExperience(src.experience)[0];
        return [
          `${profile.name} · ${profile.headline}`,
          `${profile.location.city}, ${profile.location.country} · ${yearsSince(profile.careerStart, src.now)} years shipping software`,
          company ? `Now: ${company.roles[0].title} at ${company.organization}` : '',
          '',
          profile.summary,
        ]
          .filter((line, i) => line || i === 3)
          .join('\n');
      },
    },
    {
      name: 'skills',
      usage: 'skills [area]',
      summary: 'The stack, by area',
      run: (args) => {
        const area = args.join(' ').toLowerCase();
        const areas = [...new Set(src.skills.map((s) => s.category))];
        const picked = area ? areas.filter((a) => a.toLowerCase().startsWith(area)) : areas;
        if (picked.length === 0)
          throw new Error(`no area "${args.join(' ')}". Try: ${areas.join(', ')}`);
        return columns(
          picked.map((a) => [
            a,
            src.skills
              .filter((s) => s.category === a)
              .map((s) => s.name)
              .join(', '),
          ]),
        );
      },
    },
    {
      name: 'projects',
      summary: 'What Odunayo has built',
      run: () =>
        columns(
          src.projects
            .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))
            .map((p) => [
              p.title,
              `${STATUS[p.status] ?? p.status}${p.visibility === 'private' ? ' · private' : ''} · /projects/${p.slug}`,
            ]),
        ),
    },
    {
      name: 'contact',
      summary: 'How to reach Odunayo',
      run: () =>
        columns([
          ['Email', contact.email],
          ...contact.links.map((l) => [l.label, l.url] as const),
          ['Location', `${contact.city}, ${contact.country}`],
        ]),
    },
    {
      name: 'resume',
      summary: 'The résumés to download',
      run: () =>
        [
          ...src.resumes.map((r) => `${r.id.padEnd(10)}  ${r.title}`),
          '',
          'Preview and download them in the Résumé section: /#resume',
        ].join('\n'),
    },
    {
      name: 'theme',
      usage: 'theme [light|dark|system|toggle]',
      summary: 'Show or switch the colour theme',
      run: (args) => src.theme(args[0] ?? ''),
    },
  ];
}
