"use client";

import { BarChart3, BriefcaseBusiness, LayoutDashboard, CalendarClock, CalendarDays, FileText, UserCog, MessageSquareQuote, Settings, Users, UsersRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type NavKey = "overview" | "leads" | "calendar" | "availability" | "templates" | "account" | "analytics" | "testimonials" | "caseStudies" | "team" | "settings";

// Later phases add entries here; `ownerOnly` ones are hidden from agents.
const items: { href: string; key: NavKey; Icon: LucideIcon; ownerOnly?: boolean }[] = [
  { href: "/admin/overview", key: "overview", Icon: LayoutDashboard },
  { href: "/admin/leads", key: "leads", Icon: Users },
  { href: "/admin/calendar", key: "calendar", Icon: CalendarDays },
  { href: "/admin/availability", key: "availability", Icon: CalendarClock, ownerOnly: true },
  { href: "/admin/templates", key: "templates", Icon: FileText, ownerOnly: true },
  { href: "/admin/analytics", key: "analytics", Icon: BarChart3 },
  { href: "/admin/testimonials", key: "testimonials", Icon: MessageSquareQuote },
  { href: "/admin/case-studies", key: "caseStudies", Icon: BriefcaseBusiness },
  { href: "/admin/account", key: "account", Icon: UserCog },
  { href: "/admin/team", key: "team", Icon: UsersRound, ownerOnly: true },
  { href: "/admin/settings", key: "settings", Icon: Settings, ownerOnly: true },
];

export function AdminNav({ orientation, role }: { orientation: "vertical" | "horizontal"; role: string }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("menu")}
      className={cn(orientation === "vertical" ? "grid gap-1" : "flex gap-2 overflow-x-auto")}
    >
      {items
        .filter((item) => !item.ownerOnly || role === "owner")
        .map(({ href, key, Icon }) => {
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
