import type { AdminLead, LeadStatusKey } from "./admin-lead";

const DAY = 24 * 60 * 60 * 1000;
const RIYADH_OFFSET = 3 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of the Riyadh calendar day (UTC+3, no daylight saving). */
export const riyadhDay = (date: Date): string => new Date(date.getTime() + RIYADH_OFFSET).toISOString().slice(0, 10);

export interface DayPoint {
  date: string;
  value: number;
}

/** New leads per Riyadh day for the last `days` days, oldest first, with zero-filled days. */
export function leadsPerDay(leads: AdminLead[], now: Date, days: number): DayPoint[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const key = riyadhDay(new Date(lead.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = riyadhDay(new Date(now.getTime() - (days - 1 - i) * DAY));
    return { date, value: counts.get(date) ?? 0 };
  });
}

const ORDER: LeadStatusKey[] = ["new", "contacted", "consultation", "proposal", "negotiation", "won", "lost", "parked"];

/** How many leads sit in each status now, in pipeline order, skipping empty ones. */
export function statusBreakdown(leads: AdminLead[]): { status: LeadStatusKey; value: number }[] {
  const counts = new Map<LeadStatusKey, number>();
  for (const lead of leads) counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  return ORDER.map((status) => ({ status, value: counts.get(status) ?? 0 })).filter((entry) => entry.value > 0);
}

/** Confirmed bookings per Riyadh day for the next `days` days, starting today. */
export function bookingsPerDay(bookings: { startUtc: string; status: string }[], now: Date, days: number): DayPoint[] {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status !== "confirmed") continue;
    const key = riyadhDay(new Date(booking.startUtc));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = riyadhDay(new Date(now.getTime() + i * DAY));
    return { date, value: counts.get(date) ?? 0 };
  });
}

export interface OverviewKpis {
  total: number;
  last7: number;
  previous7: number;
  won: number;
  upcomingBookings: number;
  /** Share of all leads that reached "won", as a whole percent; null with no leads. */
  winRatePercent: number | null;
}

export function overviewKpis(leads: AdminLead[], bookings: { startUtc: string; status: string }[], now: Date): OverviewKpis {
  const end = now.getTime();
  const created = (lead: AdminLead) => new Date(lead.createdAt).getTime();
  const won = leads.filter((l) => l.status === "won").length;
  return {
    total: leads.length,
    last7: leads.filter((l) => created(l) > end - 7 * DAY && created(l) <= end).length,
    previous7: leads.filter((l) => created(l) > end - 14 * DAY && created(l) <= end - 7 * DAY).length,
    won,
    upcomingBookings: bookings.filter((b) => b.status === "confirmed" && new Date(b.startUtc).getTime() > end).length,
    winRatePercent: leads.length === 0 ? null : Math.round((won / leads.length) * 100),
  };
}
