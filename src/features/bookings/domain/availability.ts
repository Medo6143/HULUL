import { formatClock, parseClock, parseDateKey } from "./riyadh-time";

// Pure domain: when consultations can be booked. All clock times are Riyadh wall-clock "HH:mm".

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type BookingError =
  | { code: "invalid_availability" }
  | { code: "invalid_date" }
  | { code: "slot_unavailable" }
  | { code: "slot_taken" }
  | { code: "too_many_bookings" }
  | { code: "not_found" }
  | { code: "invalid_token" }
  | { code: "already_cancelled" }
  | { code: "not_allowed" }
  | { code: "lead_failed" };

export interface TimeWindow {
  start: string;
  end: string;
}

export interface Availability {
  slotMinutes: number;
  bufferMinutes: number;
  /** A slot must start at least this many hours from now. */
  minNoticeHours: number;
  maxDaysAhead: number;
  /** One fixed meeting link (Meet/Zoom) pasted by the owner; shown in confirmations. Empty means none. */
  meetingLink: string;
  /** Index 0 = Sunday ... 6 = Saturday. */
  weekly: TimeWindow[][];
}

export interface AvailabilityException {
  /** Riyadh calendar date, "YYYY-MM-DD". */
  date: string;
  closed: boolean;
  /** Used when not closed: replaces that weekday's windows for the day. */
  windows: TimeWindow[];
}

/** No windows means no bookable slots: nothing is offered until the owner sets the schedule. */
export const EMPTY_AVAILABILITY: Availability = {
  slotMinutes: 30,
  bufferMinutes: 0,
  minNoticeHours: 12,
  maxDaysAhead: 30,
  meetingLink: "",
  weekly: [[], [], [], [], [], [], []],
};

const MAX_WINDOWS_PER_DAY = 4;

/** Validates, sorts, and rejects overlapping windows. */
export function normalizeWindows(windows: TimeWindow[]): Result<TimeWindow[], BookingError> {
  if (windows.length > MAX_WINDOWS_PER_DAY) return err({ code: "invalid_availability" });
  const parsed: { start: number; end: number }[] = [];
  for (const w of windows) {
    const start = parseClock(w.start);
    const end = parseClock(w.end);
    if (start === null || end === null || start >= end) return err({ code: "invalid_availability" });
    parsed.push({ start, end });
  }
  parsed.sort((a, b) => a.start - b.start);
  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i]!.start < parsed[i - 1]!.end) return err({ code: "invalid_availability" });
  }
  return ok(parsed.map((w) => ({ start: formatClock(w.start), end: formatClock(w.end) })));
}

const inRange = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

export function normalizeAvailability(input: Availability): Result<Availability, BookingError> {
  if (
    !inRange(input.slotMinutes, 15, 240) ||
    !inRange(input.bufferMinutes, 0, 120) ||
    !inRange(input.minNoticeHours, 0, 720) ||
    !inRange(input.maxDaysAhead, 1, 90) ||
    input.weekly.length !== 7
  ) {
    return err({ code: "invalid_availability" });
  }
  const link = input.meetingLink.trim();
  if (link !== "" && !(link.length <= 300 && /^https:\/\/[^\s<>"']+$/.test(link))) {
    return err({ code: "invalid_availability" });
  }
  const weekly: TimeWindow[][] = [];
  for (const day of input.weekly) {
    const windows = normalizeWindows(day);
    if (!windows.ok) return windows;
    weekly.push(windows.value);
  }
  return ok({ ...input, meetingLink: link, weekly });
}

export function normalizeException(input: AvailabilityException): Result<AvailabilityException, BookingError> {
  if (!parseDateKey(input.date)) return err({ code: "invalid_date" });
  if (input.closed) return ok({ date: input.date, closed: true, windows: [] });
  const windows = normalizeWindows(input.windows);
  if (!windows.ok) return windows;
  return ok({ date: input.date, closed: false, windows: windows.value });
}

/**
 * Firestore cannot store an array inside an array, so the weekly schedule is stored as a map keyed by weekday
 * ("0" = Sunday ... "6" = Saturday) and rebuilt into the 7-element array when read.
 */
export function weeklyToDoc(weekly: TimeWindow[][]): Record<string, TimeWindow[]> {
  return Object.fromEntries(weekly.map((windows, day) => [String(day), windows]));
}

export function weeklyFromDoc(doc: unknown): TimeWindow[][] {
  if (Array.isArray(doc) && doc.length === 7) return doc as TimeWindow[][]; // tolerate any older array shape
  const map = (doc && typeof doc === "object" ? doc : {}) as Record<string, TimeWindow[] | undefined>;
  return Array.from({ length: 7 }, (_, day) => map[String(day)] ?? []);
}
