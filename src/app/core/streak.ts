/** Consecutive training days in the player's local calendar, counting today or yesterday. */
export function trainingStreak(dates: string[], now = new Date()): number {
  const dayNumber = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  const today = dayNumber(now);
  const days = new Set(
    dates
      .map((date) => dayNumber(new Date(date)))
      .filter((day) => Number.isFinite(day) && day <= today),
  );
  let day = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day--;
  }
  return streak;
}
