"use client";

import { Check, Copy, Loader2, Mail, Plus, Send, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { buildSurveyMessage } from "@/features/surveys";
import { whatsappLink } from "@/features/templates";
import { cn } from "@/lib/cn";
import { formatDateTime } from "./format";
import { AREA, FIELD, Field, callApi } from "./showcase-shared";

export interface SurveyRow {
  id: string;
  token: string;
  projectTitle: { ar: string; en: string };
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  locale: "ar" | "en";
  status: "sent" | "answered";
  createdAt: string;
  response: { rating: number; comment: string; name: string; role: string; allowPublish: boolean; answeredAt: string } | null;
  testimonialId: string;
}

export interface SurveyProject {
  slug: string;
  title: { ar: string; en: string };
}

const ERRORS = ["invalid_input", "invalid_email", "invalid_phone", "no_email", "send_failed", "consent_missing", "not_answered", "already_converted", "not_found", "unauthorized", "forbidden"];

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={cn("size-4", n <= value ? "fill-warning text-warning" : "text-surface-line")} />
      ))}
    </span>
  );
}

/** Creates survey links for clients, sends them by WhatsApp or email, and shows the answers. */
export function SurveysView({
  surveys,
  projects,
  siteUrl,
  company,
  canDelete,
  demo,
}: {
  surveys: SurveyRow[];
  projects: SurveyProject[];
  siteUrl: string;
  company: { ar: string; en: string };
  canDelete: boolean;
  demo: boolean;
}) {
  const t = useTranslations("admin.surveys");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ projectSlug: projects[0]?.slug ?? "", projectTitle: "", clientName: "", clientPhone: "", clientEmail: "", locale: "ar" as "ar" | "en" });
  const [texts, setTexts] = useState<Record<string, { whatsapp: string; subject: string; body: string }>>({});

  const errorText = (code?: string) => (ERRORS.includes(code ?? "") ? t(`errors.${code}`) : t("errors.generic"));
  const linkOf = (s: SurveyRow) => `${siteUrl.replace(/\/$/, "")}/${s.locale}/survey/${s.token}`;
  const messageOf = (s: SurveyRow) => buildSurveyMessage({ locale: s.locale, clientName: s.clientName, projectTitle: s.projectTitle, link: linkOf(s), company });
  const textsOf = (s: SurveyRow) => {
    const m = messageOf(s);
    return texts[s.id] ?? { whatsapp: m.whatsapp, subject: m.emailSubject, body: m.emailBody };
  };

  const answered = surveys.filter((s) => s.response);
  const average = answered.length > 0 ? answered.reduce((n, s) => n + (s.response?.rating ?? 0), 0) / answered.length : null;

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy("create");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug: form.projectSlug,
          projectTitle: form.projectSlug ? undefined : { ar: form.projectTitle, en: form.projectTitle },
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          clientEmail: form.clientEmail,
          locale: form.locale,
        }),
      });
      const body = (await response.json().catch(() => null)) as { id?: string; error?: { code?: string } } | null;
      if (!response.ok) return setError(errorText(body?.error?.code));
      setForm((f) => ({ ...f, clientName: "", clientPhone: "", clientEmail: "", projectTitle: "" }));
      setOpenId(body?.id ?? null);
      setNotice(t("created"));
      router.refresh();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(null);
    }
  }

  async function act(id: string, action: () => Promise<{ ok: boolean; code?: string }>, success: string) {
    setBusy(id);
    setError(null);
    setNotice(null);
    const result = await action();
    setBusy(null);
    if (!result.ok) return setError(errorText(result.code));
    setNotice(success);
    router.refresh();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t("copied"));
    } catch {
      setError(t("errors.generic"));
    }
  }

  const link = "inline-flex min-h-10 items-center gap-2 rounded-lg ps-4 pe-4 text-[14px] font-semibold";

  return (
    <div className="grid min-w-0 gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-surface-line bg-surface p-5">
          <p className="text-[15px] text-text-muted">{t("kpi.sent")}</p>
          <p className="mt-2 text-[32px] font-bold leading-none tabular-nums">{surveys.length}</p>
        </div>
        <div className="rounded-2xl border border-surface-line bg-surface p-5">
          <p className="text-[15px] text-text-muted">{t("kpi.answered")}</p>
          <p className="mt-2 text-[32px] font-bold leading-none tabular-nums">{answered.length}</p>
        </div>
        <div className="rounded-2xl border border-surface-line bg-surface p-5">
          <p className="text-[15px] text-text-muted">{t("kpi.average")}</p>
          <p className="mt-2 flex items-center gap-3 text-[32px] font-bold leading-none tabular-nums">
            {average === null ? "-" : average.toFixed(1)}
            {average !== null ? <Stars value={Math.round(average)} label={t("ratingOf", { n: average.toFixed(1) })} /> : null}
          </p>
        </div>
      </div>

      <form onSubmit={create} className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
        <h2 className="flex items-center gap-2 text-[18px] font-bold">
          <Plus className="size-5 text-brand-strong" aria-hidden="true" />
          {t("newTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("project")}>
            <select value={form.projectSlug} disabled={demo} onChange={(e) => setForm((f) => ({ ...f, projectSlug: e.target.value }))} className={FIELD}>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title.ar}
                </option>
              ))}
              <option value="">{t("projectOther")}</option>
            </select>
          </Field>
          {form.projectSlug === "" ? (
            <Field label={t("projectName")}>
              <input required maxLength={140} value={form.projectTitle} disabled={demo} onChange={(e) => setForm((f) => ({ ...f, projectTitle: e.target.value }))} className={FIELD} />
            </Field>
          ) : null}
          <Field label={t("clientName")}>
            <input required maxLength={100} value={form.clientName} disabled={demo} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} className={FIELD} />
          </Field>
          <Field label={t("language")}>
            <select value={form.locale} disabled={demo} onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value as "ar" | "en" }))} className={FIELD}>
              <option value="ar">{t("ar")}</option>
              <option value="en">{t("en")}</option>
            </select>
          </Field>
          <Field label={t("clientPhone")} hint={t("contactHint")}>
            <input dir="ltr" inputMode="tel" placeholder="05xxxxxxxx" maxLength={30} value={form.clientPhone} disabled={demo} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} className={FIELD} />
          </Field>
          <Field label={t("clientEmail")}>
            <input type="email" dir="ltr" maxLength={200} value={form.clientEmail} disabled={demo} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} className={FIELD} />
          </Field>
        </div>
        <button type="submit" disabled={demo || busy !== null} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-ink-900 ps-6 pe-6 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50">
          {busy === "create" ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {t("create")}
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-[15px] text-danger">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl bg-success/10 p-3 text-[15px] text-success">
          {notice}
        </p>
      ) : null}

      {surveys.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-text-muted/30 bg-surface p-10 text-center text-text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4">
          {surveys.map((s) => {
            const draft = textsOf(s);
            const waHref = demo || !s.clientPhone ? null : whatsappLink(s.clientPhone, draft.whatsapp);
            const open = openId === s.id;
            return (
              <li key={s.id} className="grid gap-3 rounded-2xl border border-surface-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <b>{s.clientName}</b>
                    <span className="ms-2 text-[14px] text-text-muted">{s.projectTitle.ar}</span>
                    <p className="text-[13px] text-text-muted">{formatDateTime(s.createdAt)}</p>
                  </div>
                  <span className={cn("rounded-full ps-3 pe-3 py-1 text-[13px] font-semibold", s.status === "answered" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                    {s.status === "answered" ? t("status.answered") : t("status.sent")}
                  </span>
                </div>

                {s.response ? (
                  <div className="grid gap-2 rounded-xl bg-surface-muted p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars value={s.response.rating} label={t("ratingOf", { n: s.response.rating })} />
                      <span className="text-[14px] text-text-muted">
                        {s.response.name}
                        {s.response.role ? ` - ${s.response.role}` : ""}
                      </span>
                      <span className={cn("rounded-full ps-3 pe-3 py-0.5 text-[12px] font-semibold", s.response.allowPublish ? "bg-brand-soft text-ink-900" : "bg-surface text-text-muted")}>
                        {s.response.allowPublish ? t("allowPublish") : t("noPublish")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] leading-[1.8]">{s.response.comment}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {s.status === "sent" ? (
                    <button type="button" onClick={() => setOpenId(open ? null : s.id)} className={`${link} border border-surface-line hover:border-ink-900`}>
                      <Send className="size-4" aria-hidden="true" />
                      {t("sendPanel")}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => copy(linkOf(s))} className={`${link} border border-surface-line hover:border-ink-900`}>
                    <Copy className="size-4" aria-hidden="true" />
                    {t("copyLink")}
                  </button>
                  {s.response?.allowPublish && !s.testimonialId ? (
                    <button
                      type="button"
                      disabled={demo || busy !== null}
                      onClick={() => act(s.id, () => callApi(`/api/admin/surveys/${s.id}/convert`, "POST"), t("converted"))}
                      className={`${link} bg-ink-900 text-surface hover:bg-ink-800 disabled:opacity-50`}
                    >
                      {busy === s.id ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                      {t("convert")}
                    </button>
                  ) : null}
                  {s.testimonialId ? (
                    <Link href="/admin/testimonials" className={`${link} border border-brand-strong text-brand-strong`}>
                      {t("openTestimonials")}
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      disabled={demo || busy !== null}
                      onClick={() => {
                        if (window.confirm(t("confirmDelete"))) void act(s.id, () => callApi(`/api/admin/surveys/${s.id}`, "DELETE"), t("deleted"));
                      }}
                      className={`${link} border border-surface-line text-danger hover:border-danger disabled:opacity-50`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      {t("delete")}
                    </button>
                  ) : null}
                </div>

                {open && s.status === "sent" ? (
                  <div className="grid gap-4 rounded-xl border border-surface-line p-4">
                    <p className="text-[14px] text-text-muted" dir="ltr">
                      {linkOf(s)}
                    </p>
                    <Field label={t("whatsappText")}>
                      <textarea rows={6} value={draft.whatsapp} onChange={(e) => setTexts((x) => ({ ...x, [s.id]: { ...draft, whatsapp: e.target.value } }))} className={AREA} />
                    </Field>
                    {waHref ? (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${link} w-fit bg-whatsapp text-ink-950`}>
                        <WhatsAppIcon className="size-5" aria-hidden="true" />
                        {t("openWhatsapp")}
                      </a>
                    ) : (
                      <p className="text-[14px] text-text-muted">{t("noPhone")}</p>
                    )}
                    <div className="grid gap-3 border-t border-surface-line pt-4">
                      <Field label={t("emailSubject")}>
                        <input maxLength={150} value={draft.subject} onChange={(e) => setTexts((x) => ({ ...x, [s.id]: { ...draft, subject: e.target.value } }))} className={FIELD} />
                      </Field>
                      <Field label={t("emailBody")}>
                        <textarea rows={7} value={draft.body} onChange={(e) => setTexts((x) => ({ ...x, [s.id]: { ...draft, body: e.target.value } }))} className={AREA} />
                      </Field>
                      {s.clientEmail ? (
                        <button
                          type="button"
                          disabled={demo || busy !== null}
                          onClick={() => act(s.id, () => callApi(`/api/admin/surveys/${s.id}/send-email`, "POST", { subject: draft.subject, body: draft.body }), t("emailSent"))}
                          className={`${link} w-fit bg-ink-900 text-surface hover:bg-ink-800 disabled:opacity-50`}
                        >
                          {busy === s.id ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
                          {t("sendEmail")}
                        </button>
                      ) : (
                        <p className="text-[14px] text-text-muted">{t("noEmail")}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {demo ? <p className="text-[14px] text-text-muted">{t("demoNote")}</p> : null}
    </div>
  );
}
