import { loadBookings } from "@/app/admin/_lib/data";
import { requireStaff } from "@/app/admin/_lib/staff";
import { CalendarView } from "@/features/admin";

export default async function AdminCalendarPage() {
  await requireStaff();
  const { bookings, demo, nowIso } = await loadBookings();
  return <CalendarView bookings={bookings} nowIso={nowIso} demo={demo} />;
}
