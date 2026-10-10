import { loadRecipients } from "@/app/admin/_lib/data";
import { requireOwner } from "@/app/admin/_lib/staff";
import { SettingsView } from "@/features/admin";

export default async function AdminSettingsPage() {
  await requireOwner();
  const { recipients, demo } = await loadRecipients();
  return <SettingsView recipients={recipients} demo={demo} />;
}
