import { loadLeads } from "@/app/admin/_lib/data";
import { LeadsView } from "@/features/admin";

export default async function AdminLeadsPage() {
  const { leads, demo } = await loadLeads();
  return <LeadsView leads={leads} demo={demo} />;
}
