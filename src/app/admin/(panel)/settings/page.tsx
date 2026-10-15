import { loadRecipients, loadTelegram } from "@/app/admin/_lib/data";
import { requireOwner } from "@/app/admin/_lib/staff";
import { SettingsView } from "@/features/admin";

export default async function AdminSettingsPage() {
  await requireOwner();
  const [{ recipients, demo }, telegram] = await Promise.all([loadRecipients(), loadTelegram()]);
  return <SettingsView recipients={recipients} telegram={telegram} demo={demo} />;
}
