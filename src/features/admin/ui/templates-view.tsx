"use client";

import { Check, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { DEFAULT_TEMPLATES, MAX_LENGTHS, TEMPLATE_VARIABLES, renderTemplate, type InviteTemplates } from "@/features/templates";
import { AREA, FIELD, Field, callApi } from "./showcase-shared";

const SAMPLE = {
  ar: { name: "سارة", service: "موقع إلكتروني", date: "الأحد 12 أكتوبر", time: "10:00", meetingLink: "https://meet.example/abc", company: "حلول تك" },
  en: { name: "Sara", service: "a website", date: "Sunday 12 October", time: "10:00", meetingLink: "https://meet.example/abc", company: "HULOL TECH" },
};

export function TemplatesView({ initial, isDefault, demo }: { initial: InviteTemplates; isDefault: boolean; demo: boolean }) {
  const t = useTranslations("admin.templates");
  const router = useRouter();
  const [data, setData] = useState<InviteTemplates>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (key: keyof InviteTemplates, lang: "ar" | "en", value: string) =>
    setData((d) => ({ ...d, [key]: { ...d[key], [lang]: value } }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await callApi("/api/admin/templates", "PUT", data);
    setBusy(false);
    setMessage(result.ok ? { ok: true, text: t("saved") } : { ok: false, text: result.code === "invalid_input" ? t("errors.invalid_input") : t("errors.generic") });
    if (result.ok) router.refresh();
  }

  const blocks: { key: keyof InviteTemplates; label: string; rows: number; single?: boolean }[] = [
    { key: "whatsapp", label: t("whatsapp"), rows: 7 },
    { key: "emailSubject", label: t("emailSubject"), rows: 1, single: true },
    { key: "emailBody", label: t("emailBody"), rows: 9 },
  ];

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-text-muted">{t("subtitle")}</p>
      </div>

      <section className="rounded-2xl border border-surface-line bg-surface p-6">
        <h2 className="text-[17px] font-bold">{t("variables")}</h2>
        <p className="mt-1 text-[14px] text-text-muted">{t("variablesHint")}</p>
        <ul className="mt-3 flex flex-wrap gap-2" dir="ltr">
          {TEMPLATE_VARIABLES.map((name) => (
            <li key={name} className="rounded-lg bg-surface-muted ps-3 pe-3 py-1 font-mono text-[14px]">{`{{${name}}}`}</li>
          ))}
        </ul>
        {isDefault ? <p className="mt-3 text-[14px] text-text-muted">{t("usingDefaults")}</p> : null}
      </section>

      <form onSubmit={save} className="grid gap-6">
        {blocks.map((block) => (
          <section key={block.key} className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
            <h2 className="text-[18px] font-bold">{block.label}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(["ar", "en"] as const).map((lang) => (
                <div key={lang} className="grid gap-3">
                  <Field label={lang === "ar" ? t("arabic") : t("english")}>
                    {block.single ? (
                      <input
                        dir={lang === "en" ? "ltr" : undefined}
                        maxLength={MAX_LENGTHS[block.key]}
                        value={data[block.key][lang]}
                        disabled={demo}
                        onChange={(e) => set(block.key, lang, e.target.value)}
                        className={FIELD}
                      />
                    ) : (
                      <textarea
                        dir={lang === "en" ? "ltr" : undefined}
                        rows={block.rows}
                        maxLength={MAX_LENGTHS[block.key]}
                        value={data[block.key][lang]}
                        disabled={demo}
                        onChange={(e) => set(block.key, lang, e.target.value)}
                        className={AREA}
                      />
                    )}
                  </Field>
                  <div className="rounded-xl bg-surface-muted p-3">
                    <p className="mb-1 text-[12px] font-semibold text-text-muted">{t("preview")}</p>
                    <p dir={lang === "en" ? "ltr" : undefined} className="whitespace-pre-wrap text-[14px] leading-[1.8]">
                      {renderTemplate(data[block.key][lang] || data[block.key].ar, SAMPLE[lang])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={demo || busy}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-900 ps-6 pe-6 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            {t("save")}
          </button>
          <button
            type="button"
            disabled={demo || busy}
            onClick={() => {
              if (window.confirm(t("confirmReset"))) setData(DEFAULT_TEMPLATES);
            }}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-surface-line ps-5 pe-5 font-semibold hover:border-ink-900 disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("reset")}
          </button>
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
