"use client";

import { useTranslations } from "next-intl";
import { CONSENT_OPEN_EVENT } from "@/lib/consent";

/** Lets a visitor change or withdraw cookie consent at any time. */
export function ConsentReopen({ className }: { className?: string }) {
  const t = useTranslations("cookie");
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      {t("reopen")}
    </button>
  );
}
