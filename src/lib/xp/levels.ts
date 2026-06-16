/**
 * Focura level curve.
 * Gentle early curve = fast first wins (ADHD-friendly), steeper later.
 */

/** XP needed to advance from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return Math.round(100 * Math.pow(level, 1.4));
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
  }
  return level;
}

export function levelProgress(totalXp: number): {
  level: number;
  current: number;
  required: number;
} {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
  }
  return { level, current: remaining, required: xpToNext(level) };
}
