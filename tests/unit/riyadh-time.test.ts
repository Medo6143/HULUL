import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  formatClock,
  parseClock,
  parseDateKey,
  riyadhDateKey,
  riyadhToUtc,
  utcToRiyadh,
} from "@/features/bookings/domain/riyadh-time";

describe("riyadh time", () => {
  it("converts Riyadh wall-clock time to UTC and back", () => {
    const utc = riyadhToUtc(2026, 10, 12, 9, 30);
    expect(utc.toISOString()).toBe("2026-10-12T06:30:00.000Z");
    expect(utcToRiyadh(utc)).toMatchObject({ year: 2026, month: 10, day: 12, hour: 9, minute: 30 });
  });
  it("moves to the next Riyadh day after 21:00 UTC", () => {
    const lateUtc = new Date("2026-10-12T22:30:00Z");
    expect(riyadhDateKey(lateUtc)).toBe("2026-10-13");
    expect(utcToRiyadh(lateUtc).hour).toBe(1);
  });
  it("derives the right weekday for Riyadh, not for UTC", () => {
    // Monday 12 Oct 2026 00:30 in Riyadh is still Sunday 11 Oct 21:30 UTC.
    const t = new Date("2026-10-11T21:30:00Z");
    expect(t.getUTCDay()).toBe(0);
    expect(utcToRiyadh(t).weekday).toBe(1);
  });
  it("handles month and year boundaries", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(riyadhToUtc(2027, 1, 1, 0, 0).toISOString()).toBe("2026-12-31T21:00:00.000Z");
  });
  it("parses and rejects date keys and clock strings", () => {
    expect(parseDateKey("2026-10-12")).toEqual({ year: 2026, month: 10, day: 12 });
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("12/10/2026")).toBeNull();
    expect(parseClock("09:30")).toBe(570);
    expect(parseClock("24:00")).toBeNull();
    expect(parseClock("9:30")).toBeNull();
    expect(formatClock(570)).toBe("09:30");
  });
});
