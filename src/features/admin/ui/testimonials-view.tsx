"use client";

import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { AREA, ConsentFields, FIELD, Field, StatusBadge, callApi, useShowcaseErrors } from "./showcase-shared";

export interface TestimonialRow {
  id: string;
  quote: { ar: string; en: string };
  name: { ar: string; en: string };
  role: { ar: string; en: string };
  company: string;
  city: string;
  consentToPublish: boolean;
  consentNote: string;
  published: boolean;
  order: number;
}

const EMPTY: TestimonialRow = {
  id: "",
  quote: { ar: "", en: "" },
  name: { ar: "", en: "" },
  role: { ar: "", en: "" },
  company: "",
  city: "",
  consentToPublish: false,
  consentNote: "",
  published: false,
  order: 0,
};

export function TestimonialsView({ items, demo }: { items: TestimonialRow[]; demo: boolean }) {
  const t = useTranslations("admin.testimonials");
  const s = useTranslations("admin.showcase");
  const errorText = useShowcaseErrors();
  const router = useRouter();
  const [form, setForm] = useState<TestimonialRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TestimonialRow>(key: K, value: TestimonialRow[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const setPair = (key: "quote" | "name" | "role", lang: "ar" | "en", value: string) =>
    setForm((f) => (f ? { ...f, [key]: { ...f[key], [lang]: value } } : f));

  async function run(id: string, action: () => Promise<{ ok: boolean; code?: string }>) {
    setBusy(id);
    setError(null);
    const result = await action();
    setBusy(null);
    if (!result.ok) return setError(errorText(result.code));
    router.refresh();
    return true;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const { id, ...body } = form;
    const done = await run("form", () =>
      id ? callApi(`/api/admin/testimonials/${id}`, "PUT", body) : callApi("/api/admin/testimonials", "POST", body),
    );
    if (done) setForm(null);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-text-muted">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          disabled={demo}
          onClick={() => setForm({ ...EMPTY })}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
        >
          <Plus className="size-5" aria-hidden="true" />
          {t("add")}
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-[15px] text-danger">
          {error}
        </p>
      ) : null}

      {form ? (
        <form onSubmit={save} className="grid gap-5 rounded-2xl border border-surface-line bg-surface p-6">
          <h2 className="text-[18px] font-bold">{form.id ? t("editTitle") : t("newTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={`${t("quote")} (${s("arabic")})`}>
              <textarea required rows={4} maxLength={600} value={form.quote.ar} onChange={(e) => setPair("quote", "ar", e.target.value)} className={AREA} />
            </Field>
            <Field label={`${t("quote")} (${s("english")})`}>
              <textarea rows={4} maxLength={600} dir="ltr" value={form.quote.en} onChange={(e) => setPair("quote", "en", e.target.value)} className={AREA} />
            </Field>
            <Field label={`${t("name")} (${s("arabic")})`}>
              <input required maxLength={100} value={form.name.ar} onChange={(e) => setPair("name", "ar", e.target.value)} className={FIELD} />
            </Field>
            <Field label={`${t("name")} (${s("english")})`}>
              <input maxLength={100} dir="ltr" value={form.name.en} onChange={(e) => setPair("name", "en", e.target.value)} className={FIELD} />
            </Field>
            <Field label={`${t("role")} (${s("arabic")})`}>
              <input maxLength={100} value={form.role.ar} onChange={(e) => setPair("role", "ar", e.target.value)} className={FIELD} />
            </Field>
            <Field label={`${t("role")} (${s("english")})`}>
              <input maxLength={100} dir="ltr" value={form.role.en} onChange={(e) => setPair("role", "en", e.target.value)} className={FIELD} />
            </Field>
            <Field label={t("company")}>
              <input maxLength={100} value={form.company} onChange={(e) => set("company", e.target.value)} className={FIELD} />
            </Field>
            <Field label={t("city")}>
              <input maxLength={60} value={form.city} onChange={(e) => set("city", e.target.value)} className={FIELD} />
            </Field>
            <Field label={s("order")} hint={s("orderHint")}>
              <input type="number" min={0} max={9999} value={form.order} onChange={(e) => set("order", Number(e.target.value) || 0)} className={FIELD} />
            </Field>
          </div>
          <ConsentFields
            consent={form.consentToPublish}
            note={form.consentNote}
            published={form.published}
            disabled={busy !== null}
            onConsent={(v) => setForm((f) => (f ? { ...f, consentToPublish: v, published: v ? f.published : false } : f))}
            onNote={(v) => set("consentNote", v)}
            onPublished={(v) => set("published", v)}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-900 ps-6 pe-6 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
            >
              {busy === "form" ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
              {s("save")}
            </button>
            <button type="button" onClick={() => setForm(null)} className="min-h-12 rounded-xl border border-surface-line ps-6 pe-6 font-semibold hover:border-ink-900">
              {s("cancel")}
            </button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-text-muted/30 bg-surface p-10 text-center text-text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4">
          {items.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-2xl border border-surface-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b>{item.name.ar}</b>
                  <span className="ms-2 text-[14px] text-text-muted">{[item.role.ar, item.company].filter(Boolean).join(" - ")}</span>
                </div>
                <StatusBadge published={item.published} consent={item.consentToPublish} />
              </div>
              <p className="text-[15px] leading-[1.8] text-text-muted">{item.quote.ar}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={demo || busy !== null}
                  onClick={() => setForm(item)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  {s("edit")}
                </button>
                <button
                  type="button"
                  disabled={demo || busy !== null}
                  onClick={() => run(item.id, () => callApi(`/api/admin/testimonials/${item.id}`, "PATCH", { published: !item.published }))}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                >
                  {item.published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  {item.published ? s("unpublish") : s("publish")}
                </button>
                <button
                  type="button"
                  disabled={demo || busy !== null}
                  onClick={() => {
                    if (window.confirm(s("confirmDelete"))) run(item.id, () => callApi(`/api/admin/testimonials/${item.id}`, "DELETE"));
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold text-danger hover:border-danger disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {s("delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {demo ? <p className="text-[14px] text-text-muted">{s("demoNote")}</p> : null}
    </div>
  );
}
