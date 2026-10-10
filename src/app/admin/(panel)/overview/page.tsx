import { loadOverview } from "@/app/admin/_lib/data";
import { requireStaff } from "@/app/admin/_lib/staff";
import { OverviewView } from "@/features/admin";

export default async function AdminOverviewPage() {
  await requireStaff();
  const { data } = await loadOverview();
  return <OverviewView data={data} />;
}
