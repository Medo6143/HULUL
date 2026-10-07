import { ExternalLink, FlaskConical, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AdminNav } from "./admin-nav";

/** Sidebar on desktop, top bar on mobile. Auth is not wired yet: this is the visual shell only. */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const brand = useTranslations("brand");

  return (
    <div className="min-h-screen bg-surface-muted lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden flex-col bg-ink-950 p-5 text-surface lg:flex">
        <Link href="/admin/leads" className="mb-8 inline-flex items-center gap-3 ps-2">
          <Image src="/icons/nav-logo.png" alt="" width={36} height={36} className="size-9 object-contain" />
          <span>
            <b className="block text-[18px] leading-[1.3]">{brand("name")}</b>
            <span className="text-[13px] text-surface/60">{t("brand")}</span>
          </span>
        </Link>
        <AdminNav orientation="vertical" />
        <div className="mt-auto grid gap-3">
          <Link
            href="/ar"
            className="inline-flex min-h-11 items-center gap-3 rounded-xl ps-4 pe-4 text-[15px] text-surface/75 hover:bg-surface/10 hover:text-surface"
          >
            <ExternalLink className="size-5" aria-hidden="true" />
            {t("nav.site")}
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-surface/10 bg-surface/5 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-bold text-ink-950">
              {t("user.name").slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[15px]">{t("user.name")}</b>
              <span className="text-[13px] text-surface/60">{t("user.role")}</span>
            </span>
            <Link
              href="/admin/login"
              aria-label={t("nav.signOut")}
              className="grid size-10 place-items-center rounded-xl text-surface/70 hover:bg-surface/10 hover:text-surface"
            >
              <LogOut className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 bg-ink-950 p-3 lg:hidden">
          <Link href="/admin/leads" className="inline-flex items-center gap-2 text-surface">
            <Image src="/icons/nav-logo.png" alt="" width={28} height={28} className="size-7 object-contain" />
            <b>{brand("name")}</b>
          </Link>
          <AdminNav orientation="horizontal" />
        </div>
        <div
          role="note"
          className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 ps-4 pe-4 py-2 text-[14px] text-warning"
        >
          <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
          {t("demoBanner")}
        </div>
        <main id="main" className="ms-auto me-auto max-w-[1200px] p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
