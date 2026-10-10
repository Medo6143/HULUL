// Time helpers for the Saudi business day. Riyadh is UTC+3 all year (no daylight saving), so a fixed
// offset is exact. Everything is stored in UTC; these helpers only convert at the edges.

export const RIYADH_OFFSET_MINUTES = 180;
const MINUTE = 60_000;

export interface RiyadhParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
}

/** UTC instant to Riyadh wall-clock parts. */
export function utcToRiyadh(date: Date): RiyadhParts {
  const shifted = new Date(date.getTime() + RIYADH_OFFSET_MINUTES * MINUTE);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** Riyadh wall-clock time to the UTC instant. */
export function riyadhToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - RIYADH_OFFSET_MINUTES * MINUTE);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-12" for the Riyadh calendar day of an instant. */
export function riyadhDateKey(date: Date): string {
  const p = utcToRiyadh(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

/** "HH:mm" to minutes since midnight, or null when malformed. */
export function parseClock(value: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export const formatClock = (minutes: number): string => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Adds whole calendar days to a Riyadh date key. */
export function addDaysToKey(key: string, days: number): string {
  const parts = parseDateKey(key);
  if (!parts) throw new Error(`Bad date key: ${key}`);
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}
