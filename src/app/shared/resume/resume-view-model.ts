import { formatPeriod, type Period } from '../experience/experience';
import { yearsSince } from '../experience/years';
import type {
  Clients,
  Contact,
  Experience,
  Profile,
  Projects,
  Resumes,
  Site,
  Skills,
} from '../models/generated';
import { resolveText, type RichText, type TextContext, unfilledIn } from './resume-text';

export type ResumeDefinition = Resumes['resumes'][number];
export type ResumeSectionId = ResumeDefinition['sections'][number];
type Organization = Experience[number];
type Role = Organization['roles'][number];
type Item = ResumeDefinition['skillGroups'][number]['items'][number];

/** Everything a résumé is built from: the same data files the site uses. */
export interface ResumeSources {
  readonly resumes: Resumes;
  readonly profile: Profile;
  readonly contact: Contact;
  readonly site: Site;
  readonly experience: Experience;
  readonly skills: Skills;
  readonly projects: Projects;
  readonly clients: Clients;
}

export interface ResumeContactItem {
  readonly text: string;
  readonly href?: string;
}

export interface ResumeJob {
  readonly title: string;
  readonly dates: string;
  readonly bullets: readonly RichText[];
}

export interface ResumeOrganization {
  readonly organization: string;
  readonly location?: string;
  readonly jobs: readonly ResumeJob[];
  readonly stack: readonly RichText[];
}

/**
 * One résumé, ready to render (PRD section 8, `ResumeViewModel`). Every piece of content comes
 * from the data files; the template adds only fixed labels and layout.
 */
export interface ResumeViewModel {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly fileName: string;
  readonly paper: 'A4';
  readonly pages: { readonly target: number; readonly max: number };
  readonly sections: readonly ResumeSectionId[];
  readonly header: {
    readonly name: string;
    readonly headline: string;
    /** Two lines: location, phone and email; then the profile links and the site. */
    readonly contact: readonly (readonly ResumeContactItem[])[];
  };
  readonly summary: RichText;
  readonly skillGroups: readonly { readonly label: string; readonly items: readonly RichText[] }[];
  readonly experience: readonly ResumeOrganization[];
  readonly earlier: readonly {
    readonly title: string;
    readonly organization: string;
    readonly dates: string;
    readonly note?: string;
  }[];
  readonly clients: readonly string[];
  readonly projects: readonly {
    readonly name: RichText;
    readonly tech: readonly RichText[];
    readonly description: RichText;
  }[];
  readonly education: readonly {
    readonly title: string;
    readonly institution?: string;
    readonly dates: string;
  }[];
  readonly languages: readonly { readonly name: string; readonly level: string }[];
  readonly publications: readonly { readonly title: string; readonly meta: string }[];
  readonly press: readonly string[];
  /** Footer and running header: `Name · Résumé title`. */
  readonly footer: string;
  /** Placeholder tokens this résumé uses that have no value yet, without repeats. */
  readonly unfilled: readonly string[];
}

/**
 * The bullets a résumé shows for an entry (one role, or several merged): the highlights tagged with
 * the résumé's id, or, when none of the entry's roles has any for it, the untagged highlights the
 * site shows. Data order is kept, role by role.
 */
export function highlightsFor(
  roles: readonly Pick<Role, 'highlights'>[],
  resumeId: string,
): string[] {
  const all = roles.flatMap((r) => r.highlights);
  const tagged = all.flatMap((h) =>
    typeof h !== 'string' && h.tracks.includes(resumeId) ? [h.text] : [],
  );
  return tagged.length ? tagged : all.filter((h): h is string => typeof h === 'string');
}

/** `+2347066780373` → `+234 706 678 0373`; other numbers stay in E.164. */
export function formatPhone(e164: string): string {
  const ng = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return ng ? `+234 ${ng[1]} ${ng[2]} ${ng[3]}` : e164;
}

/** `https://www.linkedin.com/in/x/` → `linkedin.com/in/x`. */
export const displayUrl = (url: string): string =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

/** The résumé ids defined in resumes.json. */
export const resumeIds = (resumes: Resumes): string[] => resumes.resumes.map((r) => r.id);

/** Builds one résumé's view model. Throws on a reference the data validation should have caught. */
export function buildResumeViewModel(
  id: string,
  sources: ResumeSources,
  now: Date,
): ResumeViewModel {
  const { resumes, profile, contact, site, experience, skills, projects, clients } = sources;
  const resume = resumes.resumes.find((r) => r.id === id);
  if (!resume) throw new Error(`No résumé "${id}" in resumes.json`);

  const skillById = new Map(skills.map((s) => [s.id, s]));
  const roleById = new Map<string, { role: Role; org: Organization }>();
  for (const org of experience) for (const role of org.roles) roleById.set(role.id, { role, org });
  const lookup = <T>(map: Map<string, T>, key: string, what: string): T => {
    const found = map.get(key);
    if (!found) throw new Error(`Résumé "${id}": unknown ${what} "${key}"`);
    return found;
  };

  const ctx: TextContext = {
    years: yearsSince(profile.careerStart, now),
    since: (skillId) => skillById.get(skillId)?.since,
    values: new Map(resumes.placeholders.map((p) => [p.token, p.value])),
  };
  const text = (value: string): RichText => resolveText(value, ctx);
  const item = (value: Item): RichText => {
    if (typeof value === 'string') return text(value);
    const skill = lookup(skillById, value.skill, 'skill');
    return text(value.since && skill.since ? `${skill.name} (since ${skill.since})` : skill.name);
  };
  const orgName = (org: Organization) => org.legalName ?? org.organization;

  // Header
  const phone = resume.showPhone
    ? [{ text: formatPhone(contact.phone), href: `tel:${contact.phone}` }]
    : [];
  const links = resume.links.map((linkId) => {
    const link = contact.links.find((l) => l.id === linkId);
    if (!link) throw new Error(`Résumé "${id}": unknown contact link "${linkId}"`);
    return { text: displayUrl(link.url), href: link.url };
  });
  const website = resume.showWebsite ? [{ text: displayUrl(site.url), href: site.url }] : [];

  // Experience: entries in order, consecutive entries of one organization share a block.
  const blocks: { org: Organization; jobs: ResumeJob[] }[] = [];
  for (const entry of resume.experience.roles) {
    const ids = typeof entry === 'string' ? [entry] : entry.merge;
    const found = ids.map((roleId) => lookup(roleById, roleId, 'role'));
    const org = found[0].org;
    const roles = found.map((f) => f.role);
    const period: Period = {
      start: roles.map((r) => r.start).sort()[0],
      end: roles.some((r) => !r.end)
        ? null
        : roles
            .map((r) => r.end!)
            .sort()
            .at(-1),
    };
    const job: ResumeJob = {
      title: roles.map((r) => r.title).join(' · '),
      dates: formatPeriod(period),
      bullets: highlightsFor(roles, id).map(text),
    };
    const previous = blocks.at(-1);
    if (previous?.org.id === org.id) previous.jobs.push(job);
    else blocks.push({ org, jobs: [job] });
  }
  const stacks = resume.experience.stacks ?? {};

  // Companies and clients: clients.json minus the employers already listed, clients first.
  const employers = new Set(experience.map((o) => o.id));
  const clientNames = [...clients]
    .filter((c) => !employers.has(c.slug))
    .sort((a, b) => Number(a.type !== 'client') - Number(b.type !== 'client') || a.order - b.order)
    .map((c) => c.name);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const model: Omit<ResumeViewModel, 'unfilled'> = {
    id: resume.id,
    slug: resume.slug,
    title: resume.title,
    fileName: resume.fileName,
    paper: resume.paper,
    pages: resume.pages,
    sections: resume.sections,
    header: {
      name: profile.name,
      headline: resume.headline,
      contact: [
        [
          { text: `${contact.city}, ${contact.country}` },
          ...phone,
          { text: contact.email, href: `mailto:${contact.email}` },
        ],
        [...links, ...website],
      ],
    },
    summary: text(resume.summary),
    skillGroups: resume.skillGroups.map((g) => ({ label: g.label, items: g.items.map(item) })),
    experience: blocks.map(({ org, jobs }) => ({
      organization: orgName(org),
      location: org.roles.find((r) => r.location)?.location,
      jobs,
      stack: (stacks[org.id] ?? []).map(item),
    })),
    earlier: resume.experience.earlier.map((roleId) => {
      const { role, org } = lookup(roleById, roleId, 'role');
      return {
        title: role.title,
        organization: orgName(org),
        dates: formatPeriod(role),
        ...(role.brief ? { note: role.brief } : {}),
      };
    }),
    clients: clientNames,
    projects: resume.projects.map((entry) => {
      if (!('project' in entry)) {
        return {
          name: text(entry.name),
          tech: entry.tech.map(item),
          description: text(entry.description),
        };
      }
      const project = lookup(projectById, entry.project, 'project');
      return {
        name: text(entry.name ?? project.title),
        tech: (entry.tech ?? project.stack.map((skill) => ({ skill }))).map(item),
        description: text(entry.description ?? project.summary),
      };
    }),
    education: profile.education.map((e) => ({
      title: e.title,
      ...(e.institution ? { institution: e.institution } : {}),
      dates: `${e.start} – ${e.end}`,
    })),
    languages: profile.languages.map((l) => ({ name: l.name, level: l.level ?? l.proficiency })),
    publications: profile.publications.map((p) => ({
      title: p.title,
      meta: p.year ? `${p.kind}, ${p.year}` : p.kind,
    })),
    press: (profile.press ?? []).map((p) => p.title),
    footer: `${profile.name} · ${resume.title}`,
  };

  const texts: RichText[] = [
    model.summary,
    ...model.skillGroups.flatMap((g) => g.items),
    ...model.experience.flatMap((o) => [...o.stack, ...o.jobs.flatMap((j) => j.bullets)]),
    ...model.projects.flatMap((p) => [p.name, p.description, ...p.tech]),
  ];
  return { ...model, unfilled: [...new Set(texts.flatMap(unfilledIn))] };
}
