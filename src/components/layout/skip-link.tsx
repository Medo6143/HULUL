"use client";

import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("a11y");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:ps-4 focus:pe-4 focus:py-3 focus:text-text"
    >
      {t("skip")}
    </a>
  );
}
