"use client";

import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

const MAX = 10;
const ERROR_KEYS = ["invalid_email", "too_many", "empty", "unauthorized", "forbidden", "invalid_input"] as const;

export function SettingsView({ recipients, demo }: { recipients: string[]; demo: boolean }) {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  const [list, setList] = useState<string[]>(recipients.length > 0 ? recipients : [""]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const setAt = (index: number, value: string) => setList((l) => l.map((v, i) => (i === index ? value : v)));

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: list }),
      });
      const data = (await response.json().catch(() => null)) as
        | { recipients?: string[]; error?: { code?: string } }
        | null;
      if (response.ok) {
        setList(data?.recipients ?? list);
        setMessage({ ok: true, text: t("saved") });
        router.refresh();
      } else {
        const code = data?.error?.code ?? "";
        setMessage({
          ok: false,
          text: (ERROR_KEYS as readonly string[]).includes(code) ? t(`errors.${code}`) : t("errors.internal_error"),
        });
      }
    } catch {
      setMessage({ ok: false, text: t("errors.internal_error") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 text-text-muted">{t("subtitle")}</p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
        <div>
          <h2 className="text-[18px] font-bold">{t("recipientsTitle")}</h2>
          <p className="text-[15px] text-text-muted">{t("recipientsHint", { max: MAX })}</p>
        </div>
        <ul className="grid gap-3">
          {list.map((value, index) => (
            <li key={index} className="flex items-center gap-3">
              <input
                type="email"
                dir="ltr"
                aria-label={t("recipientLabel", { n: index + 1 })}
                value={value}
                disabled={demo}
                placeholder="name@company.com"
                onChange={(e) => setAt(index, e.target.value)}
                className="min-h-12 w-full rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-base focus-visible:border-brand-strong disabled:opacity-50"
              />
              <button
                type="button"
                disabled={demo || list.length === 1}
                aria-label={t("remove")}
                onClick={() => setList((l) => l.filter((_, i) => i !== index))}
                className="grid size-12 shrink-0 place-items-center rounded-xl border border-surface-line text-text-muted hover:border-danger hover:text-danger disabled:opacity-40"
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={demo || list.length >= MAX}
            onClick={() => setList((l) => [...l, ""])}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-line ps-4 pe-4 font-semibold hover:border-ink-900 disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("add")}
          </button>
          <button
            type="button"
            disabled={demo || saving}
            onClick={save}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            {t("save")}
          </button>
        </div>
        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={message.ok ? "text-[15px] text-success" : "text-[15px] text-danger"}
          >
            {message.text}
          </p>
        ) : null}
        <p className="text-[14px] text-text-muted">{t("fallbackNote")}</p>
        {demo ? <p className="text-[14px] text-text-muted">{t("demoNote")}</p> : null}
      </section>
    </div>
  );
}
