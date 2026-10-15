"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquareQuote,
  Settings,
  UserCog,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type NavKey =
  | "overview"
  | "leads"
  | "calendar"
  | "availability"
  | "templates"
  | "site"
  | "account"
  | "analytics"
  | "testimonials"
  | "surveys"
  | "caseStudies"
  | "team"
  | "settings";

type Group = "main" | "content" | "manage";

// `ownerOnly` entries are hidden from agents. A group with nothing left to show is hidden too.
const items: { href: string; key: NavKey; Icon: LucideIcon; group: Group; ownerOnly?: boolean }[] = [
  { href: "/admin/overview", key: "overview", Icon: LayoutDashboard, group: "main" },
  { href: "/admin/leads", key: "leads", Icon: Users, group: "main" },
  { href: "/admin/calendar", key: "calendar", Icon: CalendarDays, group: "main" },
  { href: "/admin/analytics", key: "analytics", Icon: BarChart3, group: "main" },
  { href: "/admin/testimonials", key: "testimonials", Icon: MessageSquareQuote, group: "content" },
  { href: "/admin/surveys", key: "surveys", Icon: ClipboardList, group: "content" },
  { href: "/admin/case-studies", key: "caseStudies", Icon: BriefcaseBusiness, group: "content" },
  { href: "/admin/availability", key: "availability", Icon: CalendarClock, group: "manage", ownerOnly: true },
  { href: "/admin/templates", key: "templates", Icon: FileText, group: "manage", ownerOnly: true },
  { href: "/admin/site", key: "site", Icon: Globe, group: "manage", ownerOnly: true },
  { href: "/admin/team", key: "team", Icon: UsersRound, group: "manage", ownerOnly: true },
  { href: "/admin/settings", key: "settings", Icon: Settings, group: "manage", ownerOnly: true },
  { href: "/admin/account", key: "account", Icon: UserCog, group: "manage" },
];

const GROUPS: Group[] = ["main", "content", "manage"];

/** The admin menu, grouped under small headings. `onNavigate` lets the mobile drawer close itself on a click. */
export function AdminNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const visible = items.filter((item) => !item.ownerOnly || role === "owner");

  return (
    <nav aria-label={t("menu")} className="grid gap-5">
      {GROUPS.map((group) => {
        const entries = visible.filter((item) => item.group === group);
        if (entries.length === 0) return null;
        return (
          <div key={group} className="grid gap-1">
            <p className="ps-4 pe-4 pb-1 text-[12px] font-semibold text-surface/45">{t(`groups.${group}`)}</p>
            <ul className="grid gap-1">
              {entries.map(({ href, key, Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl ps-4 pe-4 text-[15px] font-semibold motion-safe:transition-colors",
                        active ? "bg-brand text-ink-950" : "text-surface/75 hover:bg-surface/10 hover:text-surface",
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{t(key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
