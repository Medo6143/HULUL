"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LangSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("lang");
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      hrefLang={nextLocale}
      aria-label={t("label")}
      className="inline-flex min-h-12 items-center rounded-control border border-surface/30 ps-4 pe-4 text-[15px] font-semibold text-surface"
    >
      {t("switch")}
    </Link>
  );
}
