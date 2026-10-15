"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FIELD, Field } from "./showcase-shared";

export const SOCIAL_FIELDS = ["instagram", "x", "facebook", "linkedin", "youtube", "tiktok", "snapchat", "github", "telegram"] as const;
export type SocialField = (typeof SOCIAL_FIELDS)[number];

export interface SiteSettingsData {
  whatsappNumber: string;
  phoneDisplay: string;
  email: string;
  socials: Partial<Record<SocialField, string>>;
}

const ERRORS = ["invalid_whatsapp", "invalid_phone", "invalid_email", "invalid_url", "invalid_input", "unauthorized", "forbidden"];

/** The owner edits the public contact details and social links. Empty values hide the matching button or icon. */
export function SiteSettingsView({ initial, demo }: { initial: SiteSettingsData; demo: boolean }) {
  const t = useTranslations("admin.site");
  const router = useRouter();
  const [data, setData] = useState<SiteSettingsData>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await response.json().catch(() => null)) as { error?: { code?: string; field?: string } } | null;
      if (response.ok) {
        setMessage({ ok: true, text: t("saved") });
        router.refresh();
      } else {
        const code = body?.error?.code ?? "";
        const field = body?.error?.field;
        setMessage({
          ok: false,
          text: ERRORS.includes(code) ? t(`errors.${code}`, { field: field ? t(`social.${field as SocialField}`) : "" }) : t("errors.generic"),
        });
      }
    } catch {
      setMessage({ ok: false, text: t("errors.generic") });
    } finally {
      setBusy(false);
    }
  }

  const disabled = demo || busy;

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-text-muted">{t("subtitle")}</p>
      </div>
      <form onSubmit={save} className="grid gap-6">
        <section className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
          <h2 className="text-[18px] font-bold">{t("contactTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("whatsapp")} hint={t("whatsappHint")}>
              <input dir="ltr" inputMode="tel" placeholder="966581897297" value={data.whatsappNumber} disabled={disabled} onChange={(e) => setData((d) => ({ ...d, whatsappNumber: e.target.value }))} className={FIELD} />
            </Field>
            <Field label={t("phone")} hint={t("phoneHint")}>
              <input dir="ltr" inputMode="tel" placeholder="+966 58 189 7297" value={data.phoneDisplay} disabled={disabled} onChange={(e) => setData((d) => ({ ...d, phoneDisplay: e.target.value }))} className={FIELD} />
            </Field>
            <Field label={t("email")} hint={t("emailHint")}>
              <input type="email" dir="ltr" placeholder="hello@example.com" value={data.email} disabled={disabled} onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))} className={FIELD} />
            </Field>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
          <div>
            <h2 className="text-[18px] font-bold">{t("socialTitle")}</h2>
            <p className="text-[14px] text-text-muted">{t("socialHint")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {SOCIAL_FIELDS.map((key) => (
              <Field key={key} label={t(`social.${key}`)}>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://"
                  value={data.socials[key] ?? ""}
                  disabled={disabled}
                  onChange={(e) => setData((d) => ({ ...d, socials: { ...d.socials, [key]: e.target.value } }))}
                  className={FIELD}
                />
              </Field>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-900 ps-6 pe-6 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            {t("save")}
          </button>
          <p className="text-[14px] text-text-muted">{t("note")}</p>
        </div>
        {message ? (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-success" : "text-danger"}>
            {message.text}
          </p>
        ) : null}
        {demo ? <p className="text-[14px] text-text-muted">{t("demoNote")}</p> : null}
      </form>
    </div>
  );
}
