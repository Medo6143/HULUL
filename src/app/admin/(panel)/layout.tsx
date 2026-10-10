import type { ReactNode } from "react";
import { isAdminDemo, requireStaff } from "@/app/admin/_lib/staff";
import { AdminShell } from "@/features/admin";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  return (
    <AdminShell user={{ name: staff.name, role: staff.role }} demo={isAdminDemo()}>
      {children}
    </AdminShell>
  );
}
