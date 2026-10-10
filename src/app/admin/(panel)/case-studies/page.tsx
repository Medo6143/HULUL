import { loadCaseStudies } from "@/app/admin/_lib/data";
import { requireStaff } from "@/app/admin/_lib/staff";
import { CaseStudiesView } from "@/features/admin";

export default async function AdminCaseStudiesPage() {
  await requireStaff();
  const { items, demo } = await loadCaseStudies();
  return <CaseStudiesView items={items} demo={demo} />;
}
