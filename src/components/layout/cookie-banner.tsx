"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_OPEN_EVENT,
  CONSENT_STORAGE_KEY,
  parseConsent,
  serializeConsent,
  type ConsentState,
} from "@/lib/consent";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
    // localStorage is only available after mount, so the first render matches the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read stored consent once on mount
    setVisible(stored === null);
  }, []);

  useEffect(() => {
    const reopen = () => {
      const stored = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setVisible(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  function save(next: Pick<ConsentState, "analytics" | "marketing">) {
    const state: ConsentState = {
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(state));
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: state }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section
      aria-label={t("label")}
      className="fixed bottom-4 start-4 end-4 z-50 ms-auto me-auto max-w-xl rounded-card bg-ink-900 p-4 text-[15px] leading-[1.6] text-surface shadow-card"
    >
      <p className="text-surface/80">{t("body")}</p>
      <p className="mt-2">
        <Link href="/cookies" className="underline">
          {t("policy")}
        </Link>
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer font-semibold">{t("customize")}</summary>
        <div className="mt-3 grid gap-3">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled className="mt-1 size-5" />
            <span>
              <span className="block font-semibold">{t("necessary")}</span>
              <span className="block text-surface/70">{t("necessaryHint")}</span>
            </span>
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input
              type="checkbox"
              className="size-5"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
            />
            {t("analytics")}
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input
              type="checkbox"
              className="size-5"
              checked={marketing}
              onChange={(event) => setMarketing(event.target.checked)}
            />
            {t("marketing")}
          </label>
        </div>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={buttonClassName("primary")} onClick={() => save({ analytics: true, marketing: true })}>
          {t("accept")}
        </button>
        <button
          type="button"
          className={buttonClassName("ghost")}
          onClick={() => save({ analytics: false, marketing: false })}
        >
          {t("essential")}
        </button>
        <button
          type="button"
          className={buttonClassName("secondary")}
          onClick={() => save({ analytics, marketing })}
        >
          {t("save")}
        </button>
      </div>
    </section>
  );
}
