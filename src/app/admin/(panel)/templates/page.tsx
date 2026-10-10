import { loadTemplates } from "@/app/admin/_lib/data";
import { requireOwner } from "@/app/admin/_lib/staff";
import { TemplatesView } from "@/features/admin";

export default async function AdminTemplatesPage() {
  await requireOwner();
  const { templates, isDefault, demo } = await loadTemplates();
  return <TemplatesView initial={templates} isDefault={isDefault} demo={demo} />;
}
