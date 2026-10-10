import type { AvailabilityStore, BookingStore } from "../application/ports";
import { EMPTY_AVAILABILITY, type Availability, type AvailabilityException } from "../domain/availability";
import { holdsSlot, type Booking, type BookingStatus } from "../domain/booking";

export class InMemoryAvailabilityStore implements AvailabilityStore {
  private availability: Availability = EMPTY_AVAILABILITY;
  private readonly exceptions = new Map<string, AvailabilityException>();

  async get() {
    return this.availability;
  }
  async save(availability: Availability) {
    this.availability = availability;
  }
  async listExceptions(fromDate: string, toDate: string) {
    return [...this.exceptions.values()].filter((e) => e.date >= fromDate && e.date <= toDate);
  }
  async saveException(exception: AvailabilityException) {
    this.exceptions.set(exception.date, exception);
  }
  async deleteException(date: string) {
    this.exceptions.delete(date);
  }
}

/** Mirrors the Firestore store: the slot lock is checked and taken in one synchronous step. */
export class InMemoryBookingStore implements BookingStore {
  private readonly bookings = new Map<string, Booking>();
  private readonly locks = new Map<string, string>();

  async listBetween(from: Date, to: Date) {
    return [...this.bookings.values()].filter((b) => b.startUtc >= from && b.startUtc < to);
  }
  async get(id: string) {
    return this.bookings.get(id) ?? null;
  }
  async takenKeys(from: Date, to: Date) {
    return new Set(
      [...this.bookings.values()].filter((b) => holdsSlot(b) && b.startUtc >= from && b.startUtc < to).map((b) => b.slotKey),
    );
  }
  async reserve(booking: Booking): Promise<"ok" | "slot_taken"> {
    if (this.locks.has(booking.slotKey)) return "slot_taken";
    this.locks.set(booking.slotKey, booking.id);
    this.bookings.set(booking.id, booking);
    return "ok";
  }
  async setStatus(id: string, status: BookingStatus, at: Date) {
    const booking = this.bookings.get(id);
    if (!booking) return;
    this.bookings.set(id, { ...booking, status, updatedAt: at });
    if (!holdsSlot({ status }) && this.locks.get(booking.slotKey) === id) this.locks.delete(booking.slotKey);
  }
  async attachLead(id: string, leadId: string) {
    const booking = this.bookings.get(id);
    if (booking) this.bookings.set(id, { ...booking, leadId });
  }
  async discard(id: string) {
    const booking = this.bookings.get(id);
    if (!booking) return;
    this.bookings.delete(id);
    if (this.locks.get(booking.slotKey) === id) this.locks.delete(booking.slotKey);
  }
  async countUpcomingFor(contact: { phone: string; email: string }, from: Date) {
    return [...this.bookings.values()].filter(
      (b) =>
        holdsSlot(b) &&
        b.startUtc > from &&
        (b.phone === contact.phone || (contact.email !== "" && b.email === contact.email)),
    ).length;
  }
}
