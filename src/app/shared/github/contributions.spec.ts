import {
  contributionLevels,
  type ContributionSnapshot,
  summarizeContributions,
} from './contributions';

describe('contributionLevels', () => {
  it('shades by quartile of the busy days (1–3, 4–5, 6–7, 8+ here); none is 0', () => {
    expect(
      contributionLevels([
        [0, 1, 2, 3, 4, 5, 6],
        [7, 8, 0, 100],
      ]),
    ).toEqual([
      [0, 1, 1, 1, 2, 2, 3],
      [3, 4, 0, 4],
    ]);
  });

  it('is all 0 for an empty year, and 1 for a single busy day', () => {
    expect(contributionLevels([[0, 0]])).toEqual([[0, 0]]);
    expect(contributionLevels([[0, 3]])).toEqual([[0, 1]]);
  });
});

describe('summarizeContributions', () => {
  const snapshot: ContributionSnapshot = {
    login: 'factman',
    url: 'https://github.com/factman',
    fetchedAt: '2026-11-24T06:00:00Z',
    start: '2025-11-23',
    total: 20,
    weeks: [
      [0, 2, 3, 0, 1, 1, 1],
      [9, 0, 3],
    ],
  };

  it('counts the active days, the busiest day (with its date) and the longest streak', () => {
    expect(summarizeContributions(snapshot)).toEqual({
      total: 20,
      activeDays: 7,
      busiestDay: { date: '2025-11-30', count: 9 },
      longestStreak: 4,
    });
  });

  it('has no busiest day for an empty calendar', () => {
    expect(summarizeContributions({ ...snapshot, total: 0, weeks: [[0, 0]] })).toMatchObject({
      activeDays: 0,
      busiestDay: undefined,
      longestStreak: 0,
    });
  });
});
