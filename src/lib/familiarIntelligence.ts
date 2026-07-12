export interface FamiliarContext {
  currentHour: number;
  lastSessionEndedHoursAgo: number;
  streakDays: number;
  tasksDueToday: number;
  userTypicalFocusHour: number;
  lastFamiliarMessageShownAt: Date;
}

export function hoursDiff(dt1: Date, dt2: Date): number {
  return Math.abs(dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60);
}

export const getFamiliarMessage = (context: FamiliarContext): string | null => {
  // Don't show if shown in last 2 hours
  const hoursSinceLastMessage = hoursDiff(context.lastFamiliarMessageShownAt, new Date());
  if (hoursSinceLastMessage < 2) return null;

  // Pre-peak window message
  const minutesToPeak = (context.userTypicalFocusHour * 60) - (context.currentHour * 60);
  if (minutesToPeak > 0 && minutesToPeak <= 30) {
    return `Your peak window opens in ${minutesToPeak} minutes. The battlefield will be ready.`;
  }

  // Post long gap
  if (context.lastSessionEndedHoursAgo > 6) {
    return `It has been ${Math.round(context.lastSessionEndedHoursAgo)} hours. The realm waits, knight.`;
  }

  // Streak at risk (past 9pm, no session today)
  if (context.currentHour >= 21 && context.lastSessionEndedHoursAgo > 20) {
    return `The Oath Fire needs one more session to survive tonight.`;
  }

  // Deadline today with no progress
  if (context.tasksDueToday > 0 && context.lastSessionEndedHoursAgo > 4) {
    return `${context.tasksDueToday} quest${context.tasksDueToday > 1 ? "s" : ""} must be answered today. I am with you.`;
  }

  return null;
};
