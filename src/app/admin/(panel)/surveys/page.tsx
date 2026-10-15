import { getStaff, requireStaff } from "@/app/admin/_lib/staff";
import { loadSurveys } from "@/app/admin/_lib/data";
import { SurveysView } from "@/features/admin";

export default async function AdminSurveysPage() {
  await requireStaff();
  const staff = await getStaff();
  const data = await loadSurveys();
  return <SurveysView {...data} canDelete={staff?.role === "owner"} />;
}
