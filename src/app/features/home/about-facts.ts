import type { Profile } from '@shared';
import { iconBookOpen, iconGlobe, iconGraduationCap } from '@ui/atoms';
import type { AboutFact } from '@ui/organisms';

/** What the tiles read from profile.json (plain arrays, so an empty list type-checks too). */
interface AboutData {
  education: readonly Profile['education'][number][];
  languages: readonly Profile['languages'][number][];
  publications: readonly Profile['publications'][number][];
}

/** "2013 – 2015", or "2019" for one year; an open end reads "Present". */
export function yearRange(start: number, end?: number | null): string {
  if (end === start) return String(start);
  return `${start} – ${end ?? 'Present'}`;
}

/** The distinct values, in first-seen order. */
const distinct = <T>(values: readonly T[]): T[] => [...new Set(values)];

/**
 * The About section's tiles (the canvas's InfoTiles), from profile.json: the latest education,
 * the languages and how they are used, and the publications with their kinds and years. A tile
 * whose list is empty is left out.
 */
export function aboutFacts(profile: AboutData): AboutFact[] {
  const facts: AboutFact[] = [];

  const education = [...profile.education].sort((a, b) => b.start - a.start)[0];
  if (education) {
    facts.push({
      icon: iconGraduationCap,
      label: 'Education',
      title: education.title,
      meta: `${education.institution} · ${yearRange(education.start, education.end)}`,
    });
  }

  if (profile.languages.length) {
    facts.push({
      icon: iconGlobe,
      label: 'Languages',
      title: profile.languages.map((l) => l.name).join(', '),
      meta: distinct(profile.languages.map((l) => l.proficiency)).join(', '),
    });
  }

  if (profile.publications.length) {
    const kinds = distinct(profile.publications.map((p) => p.kind));
    const years = profile.publications.flatMap((p) => (p.year === undefined ? [] : [p.year]));
    const kind = kinds.join(', ');
    const when = years.length ? ` · ${yearRange(Math.min(...years), Math.max(...years))}` : '';
    facts.push({
      icon: iconBookOpen,
      label: 'Publications',
      title: profile.publications.map((p) => p.title).join(', '),
      meta: `${kind[0].toUpperCase()}${kind.slice(1)}${when}`,
    });
  }

  return facts;
}
