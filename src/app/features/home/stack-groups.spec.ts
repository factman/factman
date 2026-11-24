import { iconBraces, iconServer } from '@ui/atoms';

import { SKILL_ICONS, stackGroups } from './stack-groups';

const NOW = new Date('2026-11-10T12:00:00Z');

const skills = [
  { id: 'bash', name: 'Bash', category: 'Languages', featured: false, icon: 'terminal' },
  {
    id: 'ts',
    name: 'TypeScript',
    category: 'Languages',
    since: 2017,
    featured: true,
    icon: 'braces',
  },
  { id: 'node', name: 'Node.js', category: 'Backend', since: 2026, featured: true, icon: 'server' },
  { id: 'odd', name: 'Odd', category: 'Tools', since: 2020, featured: false, icon: 'unknown' },
] as const;

describe('stackGroups', () => {
  const groups = stackGroups(skills as never, NOW);

  it('groups by area in display order, featured first', () => {
    expect(groups.map((g) => g.category)).toEqual(['Languages', 'Backend', 'Tools']);
    expect(groups[0].items.map((i) => i.name)).toEqual(['TypeScript', 'Bash']);
  });

  it('counts years from since, at least one, and none without a start year', () => {
    expect(groups[0].items[0].years).toBe(9);
    expect(groups[0].items[1].years).toBeUndefined();
    expect(groups[1].items[0].years).toBe(1);
  });

  it("maps each skill's icon name to its icon, and leaves unknown names without one", () => {
    expect(groups[0].items[0].icon).toBe(iconBraces);
    expect(groups[1].items[0].icon).toBe(iconServer);
    expect(groups[2].items[0].icon).toBeUndefined();
  });

  it('has an icon for every icon name skills.json uses', async () => {
    const { skills: data } = await import('@data/skills');
    for (const s of data) expect(SKILL_ICONS[s.icon], `${s.id}: ${s.icon}`).toBeTruthy();
  });
});
