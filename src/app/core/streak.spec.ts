import { trainingStreak } from './streak';

describe('trainingStreak', () => {
  const now = new Date(2026, 9, 7, 14);
  const local = (day: number) => new Date(2026, 9, day, 12).toISOString();
  it('counts unique days and includes yesterday when today has no training', () => {
    expect(trainingStreak([local(6), local(6), local(5)], now)).toBe(2);
  });
  it('stops at a missing day and ignores invalid and future dates', () => {
    expect(trainingStreak([local(7), local(5), local(8), 'invalid'], now)).toBe(1);
    expect(trainingStreak([local(5)], now)).toBe(0);
  });
  it('uses the local calendar across a month boundary', () => {
    expect(
      trainingStreak(
        [new Date(2026, 9, 1, 1).toISOString(), new Date(2026, 8, 30, 23).toISOString()],
        new Date(2026, 9, 1, 14),
      ),
    ).toBe(2);
  });
});
