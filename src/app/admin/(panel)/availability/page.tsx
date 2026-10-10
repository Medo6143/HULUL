import { loadAvailability } from "@/app/admin/_lib/data";
import { requireOwner } from "@/app/admin/_lib/staff";
import { AvailabilityView } from "@/features/admin";

export default async function AdminAvailabilityPage() {
  await requireOwner();
  const { availability, exceptions, demo } = await loadAvailability();
  return <AvailabilityView initial={availability} exceptions={exceptions} demo={demo} />;
}
