import {
  normalizeAvailability,
  normalizeException,
  type Availability,
  type AvailabilityException,
  type BookingError,
  type Result,
} from "../domain/availability";
import { canTransitionBooking, isBookingStatus, type Booking, type BookingStatus } from "../domain/booking";
import { addDaysToKey, parseDateKey, riyadhDateKey, riyadhToUtc } from "../domain/riyadh-time";
import { generateSlots, isOfferedSlot, slotKeyOf, type SlotDay } from "../domain/slots";
import type {
  AvailabilityStore,
  BookingEvents,
  BookingStore,
  CancelTokens,
  Clock,
  IdGenerator,
  LeadCreator,
  NewLeadFromBooking,
} from "./ports";

const fail = (code: BookingError["code"]): Result<never, BookingError> => ({ ok: false, error: { code } });
const done = <T>(value: T): Result<T, BookingError> => ({ ok: true, value });

/** Upcoming confirmed bookings one phone number or email may hold at once (blocks slot hoarding). */
export const MAX_UPCOMING_PER_CONTACT = 2;

const startOfDay = (dateKey: string): Date | null => {
  const p = parseDateKey(dateKey);
  return p ? riyadhToUtc(p.year, p.month, p.day) : null;
};

async function exceptionMap(store: AvailabilityStore, fromDate: string, toDate: string) {
  const list = await store.listExceptions(fromDate, toDate);
  return new Map(list.map((e) => [e.date, e]));
}

/** Digits only, Saudi local 05xxxxxxxx treated as 9665xxxxxxxx, so the per-contact limit cannot be dodged by format. */
export function contactPhoneKey(raw: string): string {
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  return digits;
}

export function makeGetAvailableSlots(deps: { availability: AvailabilityStore; bookings: BookingStore; clock: Clock }) {
  return async function getAvailableSlots(req: { from?: string; days: number }): Promise<Result<SlotDay[], BookingError>> {
    const now = deps.clock.now();
    const fromDate = req.from ?? riyadhDateKey(now);
    const start = startOfDay(fromDate);
    if (!start) return fail("invalid_date");
    const days = Math.min(Math.max(Math.trunc(req.days) || 1, 1), 31);
    const toDate = addDaysToKey(fromDate, days);
    const end = startOfDay(toDate)!;
    const [availability, exceptions, taken] = await Promise.all([
      deps.availability.get(),
      exceptionMap(deps.availability, fromDate, toDate),
      deps.bookings.takenKeys(start, end),
    ]);
    return done(generateSlots({ availability, exceptions, takenKeys: taken, now }, fromDate, days));
  };
}

export interface RequestConsultationRequest {
  slotStartUtc: string;
  contact: { name: string; phone: string; email: string; locale: "ar" | "en" };
  lead: NewLeadFromBooking;
}

/**
 * Books a consultation slot and creates the matching lead. Order matters: the slot lock is taken first so two
 * visitors cannot get the same time; if the lead cannot be created the reservation is released.
 */
export function makeRequestConsultation(deps: {
  availability: AvailabilityStore;
  bookings: BookingStore;
  leads: LeadCreator;
  tokens: CancelTokens;
  clock: Clock;
  ids: IdGenerator;
  events?: BookingEvents;
}) {
  return async function requestConsultation(
    req: RequestConsultationRequest,
  ): Promise<Result<{ bookingId: string; leadId: string; startUtc: Date; endUtc: Date }, BookingError>> {
    const start = new Date(req.slotStartUtc);
    if (Number.isNaN(start.getTime())) return fail("invalid_date");

    const now = deps.clock.now();
    const date = riyadhDateKey(start);
    const [availability, exceptions] = await Promise.all([deps.availability.get(), exceptionMap(deps.availability, date, date)]);
    if (!isOfferedSlot({ availability, exceptions, now }, start)) return fail("slot_unavailable");

    const upcoming = await deps.bookings.countUpcomingFor(
      { phone: contactPhoneKey(req.contact.phone), email: req.contact.email.trim().toLowerCase() },
      now,
    );
    if (upcoming >= MAX_UPCOMING_PER_CONTACT) return fail("too_many_bookings");

    const { token, hash } = deps.tokens.create();
    const booking: Booking = {
      id: deps.ids.next(),
      leadId: "",
      name: req.contact.name.trim(),
      phone: contactPhoneKey(req.contact.phone),
      email: req.contact.email.trim().toLowerCase(),
      locale: req.contact.locale,
      startUtc: start,
      endUtc: new Date(start.getTime() + availability.slotMinutes * 60_000),
      slotKey: slotKeyOf(start),
      status: "confirmed",
      cancelTokenHash: hash,
      createdAt: now,
      updatedAt: now,
    };

    if ((await deps.bookings.reserve(booking)) === "slot_taken") return fail("slot_taken");

    let leadId: string;
    try {
      const lead = await deps.leads.create(req.lead);
      if (!lead.ok) {
        await deps.bookings.discard(booking.id);
        return fail("lead_failed");
      }
      leadId = lead.leadId;
      await deps.bookings.attachLead(booking.id, leadId);
    } catch (error) {
      await deps.bookings.discard(booking.id).catch(() => undefined);
      throw error;
    }

    try {
      await deps.events?.created({ booking: { ...booking, leadId }, meetingLink: availability.meetingLink, cancelToken: token });
    } catch {
      // The booking is saved; a notification problem must not undo it.
    }
    return done({ bookingId: booking.id, leadId, startUtc: booking.startUtc, endUtc: booking.endUtc });
  };
}

/** Customer cancels with the id and token from their email. A wrong token looks the same as an unknown booking. */
export function makeCancelBooking(deps: {
  availability: AvailabilityStore;
  bookings: BookingStore;
  tokens: CancelTokens;
  clock: Clock;
  events?: BookingEvents;
}) {
  return async function cancelBooking(req: { id: string; token: string }): Promise<Result<null, BookingError>> {
    const booking = await deps.bookings.get(req.id);
    if (!booking || booking.cancelTokenHash !== deps.tokens.hash(req.token)) return fail("invalid_token");
    if (booking.status !== "confirmed") return fail("already_cancelled");
    const now = deps.clock.now();
    if (booking.startUtc.getTime() <= now.getTime()) return fail("not_allowed");
    await deps.bookings.setStatus(booking.id, "cancelled", now);
    try {
      const availability = await deps.availability.get();
      await deps.events?.cancelled({ booking: { ...booking, status: "cancelled" }, meetingLink: availability.meetingLink });
    } catch {
      // Already cancelled; notifications are best effort.
    }
    return done(null);
  };
}

export function makeListBookings(deps: { bookings: BookingStore }) {
  return async function listBookings(req: { from: Date; to: Date }): Promise<Booking[]> {
    const list = await deps.bookings.listBetween(req.from, req.to);
    return list.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  };
}

/** Staff marks a booking completed, no-show, or cancelled. */
export function makeSetBookingStatus(deps: {
  availability: AvailabilityStore;
  bookings: BookingStore;
  clock: Clock;
  events?: BookingEvents;
}) {
  return async function setBookingStatus(req: { id: string; status: string }): Promise<Result<null, BookingError>> {
    if (!isBookingStatus(req.status)) return fail("not_allowed");
    const booking = await deps.bookings.get(req.id);
    if (!booking) return fail("not_found");
    if (!canTransitionBooking(booking.status, req.status as BookingStatus)) return fail("not_allowed");
    await deps.bookings.setStatus(booking.id, req.status, deps.clock.now());
    if (req.status === "cancelled") {
      try {
        const availability = await deps.availability.get();
        await deps.events?.cancelled({ booking: { ...booking, status: "cancelled" }, meetingLink: availability.meetingLink });
      } catch {
        // Best effort.
      }
    }
    return done(null);
  };
}

export function makeGetAvailability(deps: { availability: AvailabilityStore }) {
  return async function getAvailability(req: { exceptionsFrom: string; exceptionsTo: string }): Promise<{
    availability: Availability;
    exceptions: AvailabilityException[];
  }> {
    const [availability, exceptions] = await Promise.all([
      deps.availability.get(),
      deps.availability.listExceptions(req.exceptionsFrom, req.exceptionsTo),
    ]);
    return { availability, exceptions };
  };
}

export function makeSaveAvailability(deps: { availability: AvailabilityStore }) {
  return async function saveAvailability(req: { availability: Availability; updatedBy: string }): Promise<Result<Availability, BookingError>> {
    const normalized = normalizeAvailability(req.availability);
    if (!normalized.ok) return normalized;
    await deps.availability.save(normalized.value, req.updatedBy);
    return normalized;
  };
}

export function makeSaveException(deps: { availability: AvailabilityStore }) {
  return async function saveException(exception: AvailabilityException): Promise<Result<AvailabilityException, BookingError>> {
    const normalized = normalizeException(exception);
    if (!normalized.ok) return normalized;
    await deps.availability.saveException(normalized.value);
    return normalized;
  };
}

export function makeDeleteException(deps: { availability: AvailabilityStore }) {
  return async function deleteException(date: string): Promise<Result<null, BookingError>> {
    if (!parseDateKey(date)) return fail("invalid_date");
    await deps.availability.deleteException(date);
    return done(null);
  };
}
