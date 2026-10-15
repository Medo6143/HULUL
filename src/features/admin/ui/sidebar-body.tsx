"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminNav } from "./admin-nav";
import { SignOutButton } from "./sign-out-button";

/** Everything inside the sidebar: logo, grouped menu, link to the site, and the signed-in user. Also used by the drawer. */
export function SidebarBody({ user, onNavigate }: { user: { name: string; role: string }; onNavigate?: () => void }) {
  const t = useTranslations("admin");
  const brand = useTranslations("brand");

  return (
    <>
      <Link href="/admin/overview" onClick={onNavigate} className="mb-6 inline-flex shrink-0 items-center gap-3 ps-2">
        <Image src="/icons/nav-logo.png" alt="" width={36} height={36} className="size-9 object-contain" />
        <span>
          <b className="block text-[18px] leading-[1.3]">{brand("name")}</b>
          <span className="text-[13px] text-surface/60">{t("brand")}</span>
        </span>
      </Link>
      <div className="flex-1">
        <AdminNav role={user.role} onNavigate={onNavigate} />
      </div>
      <div className="mt-6 grid shrink-0 gap-3 border-t border-surface/10 pt-4">
        <Link
          href="/ar"
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center gap-3 rounded-xl ps-4 pe-4 text-[15px] text-surface/75 hover:bg-surface/10 hover:text-surface"
        >
          <ExternalLink className="size-5" aria-hidden="true" />
          {t("nav.site")}
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-surface/10 bg-surface/5 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-bold text-ink-950">{user.name.slice(0, 1)}</span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[15px]">{user.name}</b>
            <span className="text-[13px] text-surface/60">{user.role === "owner" ? t("user.owner") : t("user.agent")}</span>
          </span>
          <SignOutButton label={t("nav.signOut")} />
        </div>
      </div>
    </>
  );
}
