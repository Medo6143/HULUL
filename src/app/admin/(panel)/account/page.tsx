import { isAdminDemo, requireStaff } from "@/app/admin/_lib/staff";
import { AccountView } from "@/features/admin";

export default async function AdminAccountPage() {
  const staff = await requireStaff();
  return <AccountView name={staff.name} email={staff.email} demo={isAdminDemo()} />;
}
