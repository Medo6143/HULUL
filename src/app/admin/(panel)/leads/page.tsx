import { loadLeads } from "@/app/admin/_lib/data";
import { getStaff } from "@/app/admin/_lib/staff";
import { LeadsView } from "@/features/admin";

export default async function AdminLeadsPage() {
  const { leads, demo } = await loadLeads();
  const staff = await getStaff();
  return <LeadsView leads={leads} demo={demo} canDelete={staff?.role === "owner"} />;
}
