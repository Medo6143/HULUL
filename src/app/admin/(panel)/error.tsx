"use client";

import { useTranslations } from "next-intl";

export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("admin.errors");
  return (
    <div role="alert" className="grid justify-items-start gap-4 rounded-2xl border border-danger/30 bg-danger/5 p-8">
      <h1 className="text-[22px] font-bold text-danger">{t("internal_error")}</h1>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface"
      >
        {t("retry")}
      </button>
    </div>
  );
}
