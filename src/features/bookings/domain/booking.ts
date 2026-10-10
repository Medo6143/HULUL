export const BOOKING_STATUSES = ["confirmed", "cancelled", "completed", "no_show"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Booking {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  email: string;
  locale: "ar" | "en";
  startUtc: Date;
  endUtc: Date;
  /** Lock key; see slotKeyOf. */
  slotKey: string;
  status: BookingStatus;
  /** SHA-256 of the cancel token that is emailed to the customer. The token itself is never stored. */
  cancelTokenHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export const isBookingStatus = (value: unknown): value is BookingStatus =>
  typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value);

/** A confirmed booking can end any way; everything else is final (a freed slot may already be re-booked). */
export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return from === "confirmed" && to !== "confirmed";
}

/** Whether the booking still holds its slot. */
export const holdsSlot = (booking: Pick<Booking, "status">): boolean => booking.status === "confirmed";
