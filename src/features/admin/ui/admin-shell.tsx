import { ExternalLink, FlaskConical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AdminFeedbackProvider } from "./feedback";
import { MobileAdminMenu } from "./mobile-admin-menu";
import { SidebarBody } from "./sidebar-body";

/**
 * Desktop: a fixed-height sidebar that scrolls on its own. Phone and tablet: a slim top bar with a menu button that
 * opens the same sidebar as a drawer, so no navigation is ever cut off or squeezed into the header.
 */
export function AdminShell({
  children,
  user,
  demo,
}: {
  children: ReactNode;
  user: { name: string; role: string };
  demo: boolean;
}) {
  const t = useTranslations("admin");
  const brand = useTranslations("brand");

  return (
    <AdminFeedbackProvider>
    <div className="min-h-dvh bg-surface-muted lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="hidden h-dvh flex-col overflow-y-auto bg-ink-950 p-5 text-surface lg:sticky lg:top-0 lg:flex">
        <SidebarBody user={user} />
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 bg-ink-950 ps-4 pe-3 text-surface lg:hidden">
          <Link href="/admin/overview" className="inline-flex min-w-0 items-center gap-2">
            <Image src="/icons/nav-logo.png" alt="" width={28} height={28} className="size-7 shrink-0 object-contain" />
            <span className="min-w-0 truncate">
              <b className="text-[16px]">{brand("name")}</b>
              <span className="ms-2 text-[13px] text-surface/60">{t("brand")}</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/ar"
              aria-label={t("nav.site")}
              className="grid size-11 place-items-center rounded-xl text-surface/75 hover:bg-surface/10 hover:text-surface"
            >
              <ExternalLink className="size-5" aria-hidden="true" />
            </Link>
            <MobileAdminMenu user={user} />
          </div>
        </div>
        {demo ? (
          <div role="note" className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 ps-4 pe-4 py-2 text-[14px] text-warning">
            <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
            {t("demoBanner")}
          </div>
        ) : null}
        <main id="main" className="ms-auto me-auto min-w-0 max-w-[1200px] p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
    </AdminFeedbackProvider>
  );
}
