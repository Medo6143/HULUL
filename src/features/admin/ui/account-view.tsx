"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FIELD, Field, callApi } from "./showcase-shared";

const ERRORS = ["weak_password", "wrong_password", "too_many_attempts", "invalid_input", "unauthorized", "forbidden"];

/** A member changes their own password. After it works every session ends, so they sign in again. */
export function AccountView({ name, email, demo }: { name: string; email: string; demo: boolean }) {
  const t = useTranslations("admin.account");
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (next !== again) return setMessage({ ok: false, text: t("errors.mismatch") });
    setBusy(true);
    const result = await callApi("/api/admin/account/password", "POST", { current, next });
    setBusy(false);
    if (!result.ok) {
      return setMessage({ ok: false, text: ERRORS.includes(result.code ?? "") ? t(`errors.${result.code}`) : t("errors.generic") });
    }
    setMessage({ ok: true, text: t("changed") });
    setTimeout(() => {
      router.replace("/admin/login");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 text-text-muted">
          {name} <span dir="ltr">({email})</span>
        </p>
      </div>
      <form onSubmit={submit} className="grid max-w-xl gap-4 rounded-2xl border border-surface-line bg-surface p-6">
        <h2 className="text-[18px] font-bold">{t("changeTitle")}</h2>
        <Field label={t("current")}>
          <input type="password" dir="ltr" autoComplete="current-password" required value={current} disabled={demo || busy} onChange={(e) => setCurrent(e.target.value)} className={FIELD} />
        </Field>
        <Field label={t("next")} hint={t("nextHint")}>
          <input type="password" dir="ltr" autoComplete="new-password" required minLength={10} value={next} disabled={demo || busy} onChange={(e) => setNext(e.target.value)} className={FIELD} />
        </Field>
        <Field label={t("again")}>
          <input type="password" dir="ltr" autoComplete="new-password" required minLength={10} value={again} disabled={demo || busy} onChange={(e) => setAgain(e.target.value)} className={FIELD} />
        </Field>
        <button
          type="submit"
          disabled={demo || busy}
          className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-ink-900 ps-6 pe-6 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
          {t("save")}
        </button>
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
