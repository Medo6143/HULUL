import { loadSiteSettings } from "@/app/admin/_lib/data";
import { requireOwner } from "@/app/admin/_lib/staff";
import { SiteSettingsView } from "@/features/admin";

export default async function AdminSitePage() {
  await requireOwner();
  const { settings, demo } = await loadSiteSettings();
  return <SiteSettingsView initial={settings} demo={demo} />;
}
