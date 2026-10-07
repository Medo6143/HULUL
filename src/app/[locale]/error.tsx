"use client";

import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  const notFoundCopy = useTranslations("notFound");

  return (
    <main id="main" className="ms-auto me-auto max-w-page py-16 ps-4 pe-4 md:py-24 md:ps-6 md:pe-6">
      <h1 className="text-[26px] font-bold leading-[1.35] md:text-[36px]">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-text-muted">{t("body")}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className={buttonClassName("primary")} onClick={reset}>
          {t("retry")}
        </button>
        <Link href="/" className={buttonClassName("secondary")}>
          {notFoundCopy("home")}
        </Link>
      </div>
    </main>
  );
}
