import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  makeCancelBooking,
  makeGetAvailableSlots,
  makeListBookings,
  makeRequestConsultation,
  makeSaveAvailability,
  makeSetBookingStatus,
  type CancelTokens,
  type LeadCreator,
} from "@/features/bookings";
import { EMPTY_AVAILABILITY, normalizeAvailability, normalizeWindows, type Availability, type AvailabilityException } from "@/features/bookings/domain/availability";
import { renderBookingConfirmation, renderBookingTeamAlert } from "@/features/bookings/domain/booking-email";
import { buildIcs, foldLine } from "@/features/bookings/domain/ics";
import { riyadhToUtc, utcToRiyadh } from "@/features/bookings/domain/riyadh-time";
import { generateSlots, isOfferedSlot, slotKeyOf } from "@/features/bookings/domain/slots";
import { InMemoryAvailabilityStore, InMemoryBookingStore } from "@/features/bookings/infrastructure/in-memory-booking.store";

// Saturday 2026-10-10 11:00 in Riyadh.
const NOW = new Date("2026-10-10T08:00:00Z");
const allDays = (windows: { start: string; end: string }[]): Availability["weekly"] => Array.from({ length: 7 }, () => windows);
const availability = (over: Partial<Availability> = {}): Availability => ({
  ...EMPTY_AVAILABILITY,
  slotMinutes: 30,
  minNoticeHours: 0,
  maxDaysAhead: 30,
  weekly: allDays([{ start: "09:00", end: "11:00" }]),
  ...over,
});
const ctx = (over: Partial<Availability> = {}) => ({
  availability: availability(over),
  exceptions: new Map<string, AvailabilityException>(),
  now: NOW,
});

describe("windows and availability validation", () => {
  it("sorts windows and rejects overlaps, reversed and malformed times", () => {
    expect(normalizeWindows([{ start: "13:00", end: "15:00" }, { start: "09:00", end: "12:00" }])).toEqual({
      ok: true,
      value: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "15:00" }],
    });
    expect(normalizeWindows([{ start: "09:00", end: "12:00" }, { start: "11:00", end: "13:00" }]).ok).toBe(false);
    expect(normalizeWindows([{ start: "12:00", end: "09:00" }]).ok).toBe(false);
    expect(normalizeWindows([{ start: "9:00", end: "10:00" }]).ok).toBe(false);
  });
  it("checks ranges and the meeting link", () => {
    expect(normalizeAvailability(availability()).ok).toBe(true);
    expect(normalizeAvailability(availability({ slotMinutes: 5 })).ok).toBe(false);
    expect(normalizeAvailability(availability({ maxDaysAhead: 365 })).ok).toBe(false);
    expect(normalizeAvailability(availability({ meetingLink: "http://insecure.example" })).ok).toBe(false);
    expect(normalizeAvailability(availability({ meetingLink: "javascript:alert(1)" })).ok).toBe(false);
    expect(normalizeAvailability(availability({ meetingLink: "https://meet.google.com/abc-defg-hij" })).ok).toBe(true);
  });
});

describe("generating slots", () => {
  it("offers nothing until the owner sets a schedule", () => {
    expect(generateSlots({ availability: EMPTY_AVAILABILITY, exceptions: new Map(), now: NOW }, "2026-10-10", 14)).toEqual([]);
  });
  it("creates slots inside the windows, in Riyadh time, stored as UTC", () => {
    const days = generateSlots(ctx(), "2026-10-11", 1);
    expect(days).toHaveLength(1);
    expect(days[0]!.slots.map((s) => s.time)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(days[0]!.slots[0]!.startUtc).toBe("2026-10-11T06:00:00.000Z");
  });
  it("applies the buffer between slots", () => {
    const days = generateSlots(ctx({ slotMinutes: 30, bufferMinutes: 30 }), "2026-10-11", 1);
    expect(days[0]!.slots.map((s) => s.time)).toEqual(["09:00", "10:00"]);
  });
  it("respects minimum notice, including slots earlier today", () => {
    // Now is Saturday 11:00 Riyadh and the window ends at 11:00, so nothing is left today.
    expect(generateSlots(ctx(), "2026-10-10", 1)).toEqual([]);
    // 24 hours of notice reaches Sunday 11:00, after Sunday's window; the first offered day is Monday.
    const noticed = generateSlots(ctx({ minNoticeHours: 24 }), "2026-10-10", 3);
    expect(noticed.map((d) => d.date)).toEqual(["2026-10-12"]);
  });
  it("stops at maxDaysAhead and never returns past dates", () => {
    const days = generateSlots(ctx({ maxDaysAhead: 2 }), "2026-10-01", 31);
    expect(days.map((d) => d.date)).toEqual(["2026-10-11", "2026-10-12"]);
  });
  it("uses the weekday of the Riyadh date, not of UTC", () => {
    const sundayWeekday = utcToRiyadh(riyadhToUtc(2026, 10, 11)).weekday;
    const weekly = Array.from({ length: 7 }, (_, i) => (i === sundayWeekday ? [{ start: "00:00", end: "01:00" }] : []));
    const days = generateSlots(ctx({ weekly }), "2026-10-11", 3);
    expect(days.map((d) => d.date)).toEqual(["2026-10-11"]);
    // 00:00 Riyadh is 21:00 UTC the previous day.
    expect(days[0]!.slots[0]!.startUtc).toBe("2026-10-10T21:00:00.000Z");
  });
  it("closes a day or replaces its windows with an exception", () => {
    const closed = new Map([["2026-10-11", { date: "2026-10-11", closed: true, windows: [] }]]);
    const custom = new Map([["2026-10-12", { date: "2026-10-12", closed: false, windows: [{ start: "14:00", end: "15:00" }] }]]);
    const base = { availability: availability(), now: NOW };
    expect(generateSlots({ ...base, exceptions: closed }, "2026-10-11", 1)).toEqual([]);
    expect(generateSlots({ ...base, exceptions: custom }, "2026-10-12", 1)[0]!.slots.map((s) => s.time)).toEqual(["14:00", "14:30"]);
  });
  it("hides taken slots", () => {
    const first = generateSlots(ctx(), "2026-10-11", 1)[0]!.slots[0]!;
    const taken = new Set([slotKeyOf(new Date(first.startUtc))]);
    const days = generateSlots({ ...ctx(), takenKeys: taken }, "2026-10-11", 1);
    expect(days[0]!.slots.map((s) => s.startUtc)).not.toContain(first.startUtc);
  });
  it("validates that a requested time is an offered slot", () => {
    expect(isOfferedSlot(ctx(), new Date("2026-10-11T06:00:00Z"))).toBe(true);
    expect(isOfferedSlot(ctx(), new Date("2026-10-11T06:10:00Z"))).toBe(false); // off the grid
    expect(isOfferedSlot(ctx(), new Date("2026-10-11T12:00:00Z"))).toBe(false); // outside the window
    expect(isOfferedSlot(ctx(), new Date("2026-10-09T06:00:00Z"))).toBe(false); // in the past
  });
});

describe("calendar file", () => {
  const base = {
    uid: "b1@hulol",
    method: "REQUEST" as const,
    sequence: 0,
    start: new Date("2026-10-11T06:00:00Z"),
    end: new Date("2026-10-11T06:30:00Z"),
    stamp: NOW,
    summary: "استشارة مع حلول تك",
    description: "رابط الاجتماع; https://meet.example/x, ملاحظة\nسطر ثاني",
    location: "https://meet.example/x",
  };
  it("uses CRLF, UTC times, and escapes text", () => {
    const ics = buildIcs(base);
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261011T060000Z");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics.replace(/\r\n /g, "")).toContain("\\;");
    expect(ics.replace(/\r\n /g, "")).toContain("\\n");
  });
  it("folds long lines at 75 octets without splitting Arabic characters", () => {
    const line = `SUMMARY:${"استشارة ".repeat(30)}`;
    const folded = foldLine(line);
    expect(folded.length).toBeGreaterThan(1);
    const encoder = new TextEncoder();
    for (const piece of folded) expect(encoder.encode(piece).length).toBeLessThanOrEqual(75);
    expect(folded.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(line);
  });
  it("marks cancellations", () => {
    const ics = buildIcs({ ...base, method: "CANCEL", sequence: 1 });
    expect(ics).toContain("METHOD:CANCEL");
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("SEQUENCE:1");
  });
});

// ---- use cases ----

const tokens: CancelTokens = {
  create: () => {
    const token = `tok${Math.random().toString(36).slice(2)}`;
    return { token, hash: createHash("sha256").update(token).digest("hex") };
  },
  hash: (token) => createHash("sha256").update(token).digest("hex"),
};

function world(over: { leadOk?: boolean; clockAt?: Date } = {}) {
  const availabilityStore = new InMemoryAvailabilityStore();
  const bookings = new InMemoryBookingStore();
  const clock = { now: () => over.clockAt ?? NOW };
  let n = 0;
  const ids = { next: () => `b${++n}` };
  const created: string[] = [];
  const cancelled: string[] = [];
  const captured: { token?: string } = {};
  const leads: LeadCreator = {
    async create() {
      if (over.leadOk === false) return { ok: false, code: "invalid_phone" };
      return { ok: true, leadId: `lead${created.length + 1}` };
    },
  };
  const events = {
    async created(notice: { booking: { id: string }; cancelToken?: string }) {
      created.push(`${notice.booking.id}:${notice.cancelToken ? "token" : ""}`);
      captured.token = notice.cancelToken;
    },
    async cancelled(notice: { booking: { id: string } }) {
      cancelled.push(notice.booking.id);
    },
  };
  const request = makeRequestConsultation({ availability: availabilityStore, bookings, leads, tokens, clock, ids, events });
  const cancel = makeCancelBooking({ availability: availabilityStore, bookings, tokens, clock, events });
  const slots = makeGetAvailableSlots({ availability: availabilityStore, bookings, clock });
  const ready = async (over: Partial<Availability> = {}) => {
    const r = await makeSaveAvailability({ availability: availabilityStore })({ availability: availability(over), updatedBy: "t" });
    expect(r.ok).toBe(true);
  };
  const slot = "2026-10-11T06:00:00.000Z";
  const who = (phone: string, email = "") => ({
    slotStartUtc: slot,
    contact: { name: "عميل", phone, email, locale: "ar" as const },
    lead: { input: {}, ipHash: "h" },
  });
  return { availabilityStore, bookings, request, cancel, slots, ready, created, cancelled, slot, who, captured, clock };
}

describe("booking a consultation", () => {
  it("books an offered slot, creates the lead, notifies, and hides the slot afterwards", async () => {
    const w = world();
    await w.ready();
    const result = await w.request(w.who("0501234567"));
    expect(result.ok && result.value.leadId).toBe("lead1");
    expect(w.created).toEqual(["b1:token"]);
    const days = await w.slots({ from: "2026-10-11", days: 1 });
    expect(days.ok && days.value[0]!.slots.map((s) => s.startUtc)).not.toContain(w.slot);
    const stored = await w.bookings.get("b1");
    expect(stored?.leadId).toBe("lead1");
    expect(stored?.phone).toBe("966501234567");
    expect(stored?.cancelTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
  it("refuses a time that is not offered", async () => {
    const w = world();
    expect((await w.request(w.who("0501234567"))).ok).toBe(false); // no schedule yet
    await w.ready();
    expect(await w.request({ ...w.who("0501234567"), slotStartUtc: "2026-10-11T06:10:00.000Z" })).toMatchObject({ ok: false, error: { code: "slot_unavailable" } });
    expect(await w.request({ ...w.who("0501234567"), slotStartUtc: "not a date" })).toMatchObject({ ok: false, error: { code: "invalid_date" } });
  });
  it("never gives one slot to two people, even with concurrent requests", async () => {
    const w = world();
    await w.ready();
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => w.request(w.who(`05000000${String(i).padStart(2, "0")}`))));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.error.code === "slot_taken")).toHaveLength(9);
    expect(await w.bookings.listBetween(new Date(0), new Date("2100-01-01"))).toHaveLength(1);
  });
  it("releases the slot when the lead cannot be created", async () => {
    const w = world({ leadOk: false });
    await w.ready();
    expect(await w.request(w.who("0501234567"))).toMatchObject({ ok: false, error: { code: "lead_failed" } });
    expect((await w.bookings.takenKeys(new Date(0), new Date("2100-01-01"))).size).toBe(0);
    expect(w.created).toEqual([]);
  });
  it("limits upcoming bookings per phone, whatever its format, and per email", async () => {
    const w = world();
    await w.ready();
    const at = (iso: string, phone: string, email = "") => ({ ...w.who(phone, email), slotStartUtc: iso });
    expect((await w.request(at("2026-10-11T06:00:00.000Z", "0501234567"))).ok).toBe(true);
    expect((await w.request(at("2026-10-11T06:30:00.000Z", "+966501234567"))).ok).toBe(true);
    expect(await w.request(at("2026-10-11T07:00:00.000Z", "966 50 123 4567"))).toMatchObject({ ok: false, error: { code: "too_many_bookings" } });
    expect((await w.request(at("2026-10-12T06:00:00.000Z", "0555555555", "A@x.com"))).ok).toBe(true);
    expect((await w.request(at("2026-10-12T06:30:00.000Z", "0566666666", "a@X.com"))).ok).toBe(true);
    expect(await w.request(at("2026-10-12T07:00:00.000Z", "0577777777", "a@x.com"))).toMatchObject({ ok: false, error: { code: "too_many_bookings" } });
  });
});

describe("cancelling", () => {
  it("needs the right token, frees the slot for someone else, and cannot be repeated", async () => {
    const w = world();
    await w.ready();
    const first = await w.request(w.who("0501111111"));
    const id = first.ok ? first.value.bookingId : "";
    expect(await w.request(w.who("0502222222"))).toMatchObject({ ok: false, error: { code: "slot_taken" } });
    expect(await w.cancel({ id, token: "wrong" })).toMatchObject({ ok: false, error: { code: "invalid_token" } });
    expect(await w.cancel({ id: "missing", token: w.captured.token! })).toMatchObject({ ok: false, error: { code: "invalid_token" } });
    expect((await w.cancel({ id, token: w.captured.token! })).ok).toBe(true);
    expect(w.cancelled).toEqual([id]);
    expect(await w.cancel({ id, token: w.captured.token! })).toMatchObject({ ok: false, error: { code: "already_cancelled" } });
    expect((await w.request(w.who("0502222222"))).ok).toBe(true);
  });
  it("cannot cancel a meeting that already started", async () => {
    const w = world();
    await w.ready();
    const first = await w.request(w.who("0501111111"));
    const id = first.ok ? first.value.bookingId : "";
    const late = makeCancelBooking({
      availability: w.availabilityStore,
      bookings: w.bookings,
      tokens,
      clock: { now: () => new Date("2026-10-11T06:05:00Z") },
    });
    expect(await late({ id, token: w.captured.token! })).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });
});

describe("staff actions", () => {
  it("lists in time order and only lets confirmed bookings change status", async () => {
    const w = world();
    await w.ready();
    await w.request({ ...w.who("0501111111"), slotStartUtc: "2026-10-11T06:30:00.000Z" });
    await w.request({ ...w.who("0502222222"), slotStartUtc: "2026-10-11T06:00:00.000Z" });
    const list = await makeListBookings({ bookings: w.bookings })({ from: new Date("2026-10-11T00:00:00Z"), to: new Date("2026-10-12T00:00:00Z") });
    expect(list.map((b) => b.startUtc.toISOString())).toEqual(["2026-10-11T06:00:00.000Z", "2026-10-11T06:30:00.000Z"]);
    const setStatus = makeSetBookingStatus({ availability: w.availabilityStore, bookings: w.bookings, clock: w.clock, events: { created: async () => {}, cancelled: async () => {} } });
    const id = list[0]!.id;
    expect((await setStatus({ id, status: "completed" })).ok).toBe(true);
    expect(await setStatus({ id, status: "cancelled" })).toMatchObject({ ok: false, error: { code: "not_allowed" } });
    expect(await setStatus({ id: "zzz", status: "completed" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await setStatus({ id, status: "bogus" })).toMatchObject({ ok: false, error: { code: "not_allowed" } });
  });
  it("cancelling by staff frees the slot", async () => {
    const w = world();
    await w.ready();
    const first = await w.request(w.who("0501111111"));
    const id = first.ok ? first.value.bookingId : "";
    const setStatus = makeSetBookingStatus({ availability: w.availabilityStore, bookings: w.bookings, clock: w.clock, events: { created: async () => {}, cancelled: async () => {} } });
    await setStatus({ id, status: "cancelled" });
    expect((await w.request(w.who("0502222222"))).ok).toBe(true);
  });
});

describe("booking emails", () => {
  const input = {
    locale: "ar" as const,
    name: "<b>سارة</b>",
    phone: "966501234567",
    email: "s@example.com",
    startUtc: new Date("2026-10-11T06:00:00Z"),
    meetingLink: "https://meet.example/x?a=1&b=2",
    cancelUrl: "https://site.example/ar/booking/cancel?b=1&t=2",
  };
  it("shows Riyadh time, escapes names, includes links, and has no emoji", () => {
    const mail = renderBookingConfirmation(input);
    expect(mail.text).toContain("09:00");
    expect(mail.text).toContain("توقيت الرياض");
    expect(mail.html).not.toContain("<b>سارة</b>");
    expect(mail.html).toContain("&amp;b=2");
    expect(mail.text).toContain(input.cancelUrl);
    expect(mail.subject + mail.text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it("omits the meeting link when none is set and gives the team the contact details", () => {
    expect(renderBookingConfirmation({ ...input, meetingLink: "" }).text).not.toContain("رابط الاجتماع");
    const alert = renderBookingTeamAlert(input);
    expect(alert.text).toContain("966501234567");
    expect(alert.text).toContain("s@example.com");
  });
});

describe("weekly schedule storage", () => {
  it("never stores an array inside an array and round-trips", async () => {
    const { weeklyFromDoc, weeklyToDoc } = await import("@/features/bookings/domain/availability");
    const weekly = [[{ start: "09:00", end: "12:00" }], [], [], [{ start: "10:00", end: "11:00" }], [], [], []];
    const doc = weeklyToDoc(weekly);
    expect(Array.isArray(doc)).toBe(false);
    expect(Object.values(doc).every((v) => Array.isArray(v) && v.every((w) => !Array.isArray(w)))).toBe(true);
    expect(weeklyFromDoc(doc)).toEqual(weekly);
    expect(weeklyFromDoc(undefined)).toHaveLength(7);
    expect(weeklyFromDoc({ "2": [{ start: "08:00", end: "09:00" }] })[2]).toEqual([{ start: "08:00", end: "09:00" }]);
  });
});
