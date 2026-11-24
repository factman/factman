import { experience } from '@data/experience';

import { openApp, text } from './it-harness';

// IT-02 (US-05): organizations and roles in FR-13 order, from experience.json. Current roles first,
// then ended ones, each group by start date, newest first.
describe('IT-02 Experience shows organizations and roles in FR-13 order', () => {
  /** An organization's place in FR-13: has it a current role, and its newest start. */
  const rank = (name: string) => {
    const org = experience.find((o) => o.organization === name)!;
    return {
      current: org.roles.some((r) => !r.end),
      start: org.roles
        .map((r) => r.start)
        .sort()
        .at(-1)!,
    };
  };

  it('lists every organization: current ones first, then by start date, newest first', async () => {
    const { page } = await openApp('/');
    const names = [...page.querySelectorAll('#experience .experience-timeline-item h3')].map((h) =>
      text(h)!.replace(' (opens in a new tab)', ''),
    );
    expect([...names].sort()).toEqual(experience.map((o) => o.organization).sort());
    for (let i = 1; i < names.length; i++) {
      const [a, b] = [rank(names[i - 1]), rank(names[i])];
      expect(Number(b.current) <= Number(a.current), `${names[i]} after ${names[i - 1]}`).toBe(
        true,
      );
      if (a.current === b.current) expect(a.start >= b.start, names[i]).toBe(true);
    }
  });

  it('shows "Present" for every current role', async () => {
    const { page } = await openApp('/');
    const current = experience.flatMap((o) => o.roles).filter((r) => !r.end).length;
    const present = (page.querySelector('#experience')!.textContent!.match(/Present/g) ?? [])
      .length;
    expect(present).toBeGreaterThanOrEqual(current);
  });
});
