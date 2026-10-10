import type { App } from "firebase-admin/app";
import { FieldPath, FieldValue, Timestamp, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { AvailabilityStore, BookingStore } from "../application/ports";
import { EMPTY_AVAILABILITY, type Availability, type AvailabilityException } from "../domain/availability";
import { holdsSlot, type Booking, type BookingStatus } from "../domain/booking";

const toDoc = (booking: Booking) => {
  const { id, startUtc, endUtc, createdAt, updatedAt, ...rest } = booking;
  void id;
  return {
    ...rest,
    startUtc: Timestamp.fromDate(startUtc),
    endUtc: Timestamp.fromDate(endUtc),
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(updatedAt),
  };
};

const fromDoc = (id: string, data: FirebaseFirestore.DocumentData): Booking =>
  ({
    ...data,
    id,
    startUtc: (data.startUtc as Timestamp).toDate(),
    endUtc: (data.endUtc as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  }) as Booking;

/**
 * `bookings/{id}` holds the booking; `bookingSlots/{slotKey}` is the lock. Taking the lock and writing the booking
 * happen in one transaction, so concurrent requests for the same slot cannot both succeed.
 */
export class FirestoreBookingStore implements BookingStore {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async listBetween(from: Date, to: Date): Promise<Booking[]> {
    const snap = await this.db
      .collection("bookings")
      .where("startUtc", ">=", Timestamp.fromDate(from))
      .where("startUtc", "<", Timestamp.fromDate(to))
      .get();
    return snap.docs.map((doc) => fromDoc(doc.id, doc.data()));
  }

  async get(id: string): Promise<Booking | null> {
    const snap = await this.db.collection("bookings").doc(id).get();
    return snap.exists ? fromDoc(snap.id, snap.data()!) : null;
  }

  async takenKeys(from: Date, to: Date): Promise<Set<string>> {
    const list = await this.listBetween(from, to);
    return new Set(list.filter(holdsSlot).map((b) => b.slotKey));
  }

  async reserve(booking: Booking): Promise<"ok" | "slot_taken"> {
    const lockRef = this.db.collection("bookingSlots").doc(booking.slotKey);
    const bookingRef = this.db.collection("bookings").doc(booking.id);
    return this.db.runTransaction(async (tx) => {
      if ((await tx.get(lockRef)).exists) return "slot_taken" as const;
      tx.set(lockRef, { bookingId: booking.id, startUtc: Timestamp.fromDate(booking.startUtc) });
      tx.set(bookingRef, toDoc(booking));
      return "ok" as const;
    });
  }

  async setStatus(id: string, status: BookingStatus, at: Date): Promise<void> {
    const bookingRef = this.db.collection("bookings").doc(id);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) return;
      const slotKey = snap.data()!.slotKey as string;
      const lockRef = this.db.collection("bookingSlots").doc(slotKey);
      const lock = holdsSlot({ status }) ? null : await tx.get(lockRef);
      tx.update(bookingRef, { status, updatedAt: Timestamp.fromDate(at) });
      if (lock?.exists && lock.data()!.bookingId === id) tx.delete(lockRef);
    });
  }

  async attachLead(id: string, leadId: string): Promise<void> {
    await this.db.collection("bookings").doc(id).update({ leadId });
  }

  async discard(id: string): Promise<void> {
    const bookingRef = this.db.collection("bookings").doc(id);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) return;
      const lockRef = this.db.collection("bookingSlots").doc(snap.data()!.slotKey as string);
      const lock = await tx.get(lockRef);
      tx.delete(bookingRef);
      if (lock.exists && lock.data()!.bookingId === id) tx.delete(lockRef);
    });
  }

  async countUpcomingFor(contact: { phone: string; email: string }, from: Date): Promise<number> {
    const queries = [this.db.collection("bookings").where("phone", "==", contact.phone).get()];
    if (contact.email) queries.push(this.db.collection("bookings").where("email", "==", contact.email).get());
    const snaps = await Promise.all(queries);
    const ids = new Set<string>();
    for (const snap of snaps) {
      for (const doc of snap.docs) {
        const booking = fromDoc(doc.id, doc.data());
        if (holdsSlot(booking) && booking.startUtc > from) ids.add(doc.id);
      }
    }
    return ids.size;
  }
}

export class FirestoreAvailabilityStore implements AvailabilityStore {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async get(): Promise<Availability> {
    const snap = await this.db.collection("settings").doc("availability").get();
    if (!snap.exists) return EMPTY_AVAILABILITY;
    const data = snap.data() as Partial<Availability>;
    return {
      slotMinutes: data.slotMinutes ?? EMPTY_AVAILABILITY.slotMinutes,
      bufferMinutes: data.bufferMinutes ?? EMPTY_AVAILABILITY.bufferMinutes,
      minNoticeHours: data.minNoticeHours ?? EMPTY_AVAILABILITY.minNoticeHours,
      maxDaysAhead: data.maxDaysAhead ?? EMPTY_AVAILABILITY.maxDaysAhead,
      meetingLink: data.meetingLink ?? "",
      weekly: Array.isArray(data.weekly) && data.weekly.length === 7 ? data.weekly : EMPTY_AVAILABILITY.weekly,
    };
  }

  async save(availability: Availability, updatedBy: string): Promise<void> {
    await this.db
      .collection("settings")
      .doc("availability")
      .set({ ...availability, updatedBy, updatedAt: FieldValue.serverTimestamp() });
  }

  async listExceptions(fromDate: string, toDate: string): Promise<AvailabilityException[]> {
    const snap = await this.db
      .collection("availabilityExceptions")
      .where(FieldPath.documentId(), ">=", fromDate)
      .where(FieldPath.documentId(), "<=", toDate)
      .get();
    return snap.docs.map((doc) => ({ date: doc.id, ...(doc.data() as Omit<AvailabilityException, "date">) }));
  }

  async saveException(exception: AvailabilityException): Promise<void> {
    await this.db
      .collection("availabilityExceptions")
      .doc(exception.date)
      .set({ closed: exception.closed, windows: exception.windows });
  }

  async deleteException(date: string): Promise<void> {
    await this.db.collection("availabilityExceptions").doc(date).delete();
  }
}
