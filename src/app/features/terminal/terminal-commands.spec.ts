import { contact } from '@data/contact';
import { experience } from '@data/experience';
import { profile } from '@data/profile';
import { projects } from '@data/projects';
import { resumes } from '@data/resumes';
import { skills } from '@data/skills';
import { runCommand } from '@shared';

import { terminalCommands } from './terminal-commands';

describe('terminalCommands (FR-36), from the data files', () => {
  const theme = vi.fn((arg: string) => `theme: ${arg || 'light'}`);
  const commands = terminalCommands({
    profile,
    experience,
    skills,
    projects,
    contact,
    resumes: resumes.resumes,
    theme,
    now: new Date('2026-11-24'),
  });
  const run = (line: string) => runCommand(commands, line);

  it('has the PRD commands, listed by help', () => {
    expect(commands.map((c) => c.name)).toEqual([
      'about',
      'skills',
      'projects',
      'contact',
      'resume',
      'theme',
    ]);
    const help = run('help').text;
    for (const name of [
      'about',
      'skills',
      'projects',
      'contact',
      'resume',
      'theme',
      'help',
      'clear',
    ]) {
      expect(help).toContain(name);
    }
  });

  it('about: the name, headline, place and current role', () => {
    const { text } = run('about');
    expect(text).toContain(profile.name);
    expect(text).toContain(profile.headline);
    expect(text).toContain(`${profile.location.city}, ${profile.location.country}`);
    expect(text).toContain(profile.summary);
  });

  it('skills: every skill under its area, or one area', () => {
    const all = run('skills').text;
    for (const s of skills) expect(all).toContain(s.name);
    const one = run('skills front').text;
    expect(one.startsWith('Frontend')).toBe(true);
    expect(one.split('\n')).toHaveLength(1);
    expect(run('skills cobol')).toMatchObject({ kind: 'error' });
  });

  it('projects: every project with its status and page', () => {
    const { text } = run('projects');
    for (const p of projects) {
      expect(text).toContain(p.title);
      expect(text).toContain(`/projects/${p.slug}`);
    }
  });

  it('contact: the email, every link and the city, never a street', () => {
    const { text } = run('contact');
    expect(text).toContain(contact.email);
    for (const l of contact.links) expect(text).toContain(l.url);
    expect(text).toContain(`${contact.city}, ${contact.country}`);
  });

  it('resume: every résumé and where to get them', () => {
    const { text } = run('resume');
    for (const r of resumes.resumes) expect(text).toContain(r.title);
    expect(text).toContain('/#resume');
  });

  it('theme: passes its option to the theme service', () => {
    expect(run('theme dark').text).toBe('theme: dark');
    expect(theme).toHaveBeenLastCalledWith('dark');
    run('theme');
    expect(theme).toHaveBeenLastCalledWith('');
  });
});
