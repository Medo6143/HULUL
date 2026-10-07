"use client";

import { BarChart3, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const items: { href: string; key: "leads" | "analytics"; Icon: LucideIcon }[] = [
  { href: "/admin/leads", key: "leads", Icon: Users },
  { href: "/admin/analytics", key: "analytics", Icon: BarChart3 },
];

export function AdminNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("menu")}
      className={cn(orientation === "vertical" ? "grid gap-1" : "flex gap-2 overflow-x-auto")}
    >
      {items.map(({ href, key, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-3 rounded-xl ps-4 pe-4 text-[15px] font-semibold motion-safe:transition-colors",
              active
                ? "bg-brand text-ink-950"
                : "text-surface/75 hover:bg-surface/10 hover:text-surface",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
