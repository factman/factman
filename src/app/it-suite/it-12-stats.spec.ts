import { experience } from '@data/experience';
import { profile } from '@data/profile';
import { projects } from '@data/projects';
import { skills } from '@data/skills';

import { openApp, text } from './it-harness';

// IT-12 (US-04): every StatsPanel value is an aggregate of the data files; none is typed in.
describe('IT-12 StatsPanel values equal aggregates of the data files', () => {
  it('shows the organizations, projects, technologies and years counted from the JSON', async () => {
    const { page } = await openApp('/');
    const counters = [...page.querySelectorAll('#stats .stats-panel-counters > li')].map((li) =>
      text(li)!,
    );
    const years = new Date().getFullYear() - Number(profile.careerStart.slice(0, 4));
    for (const value of [experience.length, projects.length, skills.length]) {
      expect(
        counters.some((c) => c.includes(String(value))),
        `${value} in ${counters}`,
      ).toBe(true);
    }
    expect(counters.some((c) => c.includes(String(years)) || c.includes(String(years - 1)))).toBe(
      true,
    );
  });
});
