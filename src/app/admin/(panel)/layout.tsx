import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
