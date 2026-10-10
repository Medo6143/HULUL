import type { Availability, AvailabilityException, TimeWindow } from "./availability";
import { addDaysToKey, formatClock, parseClock, parseDateKey, riyadhDateKey, riyadhToUtc } from "./riyadh-time";

export interface Slot {
  /** ISO UTC start. */
  startUtc: string;
  /** Riyadh wall-clock "HH:mm" for display. */
  time: string;
}

export interface SlotDay {
  date: string;
  slots: Slot[];
}

/** Lock key for a slot: the start instant in whole minutes since the epoch. */
export const slotKeyOf = (start: Date): string => String(Math.floor(start.getTime() / 60_000));

const weekdayOf = (dateKey: string): number => {
  const p = parseDateKey(dateKey);
  return p ? new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay() : 0;
};

function windowsFor(
  date: string,
  availability: Availability,
  exceptions: ReadonlyMap<string, AvailabilityException>,
): TimeWindow[] {
  const exception = exceptions.get(date);
  if (exception) return exception.closed ? [] : exception.windows;
  return availability.weekly[weekdayOf(date)] ?? [];
}

export interface SlotContext {
  availability: Availability;
  exceptions: ReadonlyMap<string, AvailabilityException>;
  /** Slot keys already booked. */
  takenKeys?: ReadonlySet<string>;
  now: Date;
}

/**
 * Bookable slots for `days` Riyadh calendar days starting at `fromDate`. A slot is offered only if it ends inside
 * a window, starts after the minimum notice, falls within `maxDaysAhead`, and is not already taken.
 */
export function generateSlots(ctx: SlotContext, fromDate: string, days: number): SlotDay[] {
  const { availability, exceptions, now } = ctx;
  const today = riyadhDateKey(now);
  const earliest = now.getTime() + availability.minNoticeHours * 3_600_000;
  const lastDate = addDaysToKey(today, availability.maxDaysAhead);
  const step = availability.slotMinutes + availability.bufferMinutes;
  const result: SlotDay[] = [];

  for (let i = 0; i < Math.min(Math.max(days, 0), 31); i++) {
    const date = addDaysToKey(fromDate, i);
    if (date < today || date > lastDate) continue;
    const parts = parseDateKey(date);
    if (!parts) continue;
    const slots: Slot[] = [];
    for (const window of windowsFor(date, availability, exceptions)) {
      const start = parseClock(window.start);
      const end = parseClock(window.end);
      if (start === null || end === null) continue;
      for (let t = start; t + availability.slotMinutes <= end; t += step) {
        const startUtc = riyadhToUtc(parts.year, parts.month, parts.day, Math.floor(t / 60), t % 60);
        if (startUtc.getTime() < earliest) continue;
        if (ctx.takenKeys?.has(slotKeyOf(startUtc))) continue;
        slots.push({ startUtc: startUtc.toISOString(), time: formatClock(t) });
      }
    }
    if (slots.length > 0) result.push({ date, slots });
  }
  return result;
}

/** Server-side check that a requested start is a real offered slot (ignoring whether it is already taken). */
export function isOfferedSlot(ctx: SlotContext, start: Date): boolean {
  const date = riyadhDateKey(start);
  const wanted = start.toISOString();
  return generateSlots({ ...ctx, takenKeys: undefined }, date, 1).some((day) => day.slots.some((s) => s.startUtc === wanted));
}
