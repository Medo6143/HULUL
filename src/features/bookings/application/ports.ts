import type { Availability, AvailabilityException } from "../domain/availability";
import type { Booking, BookingStatus } from "../domain/booking";

export interface AvailabilityStore {
  get(): Promise<Availability>;
  save(availability: Availability, updatedBy: string): Promise<void>;
  listExceptions(fromDate: string, toDate: string): Promise<AvailabilityException[]>;
  saveException(exception: AvailabilityException): Promise<void>;
  deleteException(date: string): Promise<void>;
}

export interface BookingStore {
  /** Bookings whose start is in [from, to), any status. */
  listBetween(from: Date, to: Date): Promise<Booking[]>;
  get(id: string): Promise<Booking | null>;
  /** Slot keys held by confirmed bookings starting in [from, to). */
  takenKeys(from: Date, to: Date): Promise<Set<string>>;
  /**
   * Atomically takes the slot lock and stores the booking. Returns "slot_taken" when another booking already
   * holds that slot, so two visitors can never get the same time.
   */
  reserve(booking: Booking): Promise<"ok" | "slot_taken">;
  /** Atomically changes the status and, when the booking stops holding its slot, frees the lock. */
  setStatus(id: string, status: BookingStatus, at: Date): Promise<void>;
  attachLead(id: string, leadId: string): Promise<void>;
  /** Frees a reservation that never became a real booking (used when lead creation fails). */
  discard(id: string): Promise<void>;
  /** Confirmed bookings starting after `from` for this phone number or email. */
  countUpcomingFor(contact: { phone: string; email: string }, from: Date): Promise<number>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

/** Cancel tokens: random, emailed to the customer, stored only as a hash. */
export interface CancelTokens {
  create(): { token: string; hash: string };
  hash(token: string): string;
}

export interface NewLeadFromBooking {
  input: unknown;
  ipHash: string;
}

/** Creates the lead for a booking. Wired in the composition root so `bookings` never imports `leads`. */
export interface LeadCreator {
  create(request: NewLeadFromBooking): Promise<{ ok: true; leadId: string } | { ok: false; code: string }>;
}

export interface BookingNotice {
  booking: Booking;
  meetingLink: string;
  /** Raw cancel token, only available right after creation. */
  cancelToken?: string;
}

/** What other parts of the system learn about bookings. Failures here never fail the booking. */
export interface BookingEvents {
  created(notice: BookingNotice): Promise<void>;
  cancelled(notice: BookingNotice): Promise<void>;
}
