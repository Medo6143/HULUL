"use client";

import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { cn } from "@/lib/cn";
import { uploadImage } from "./image-uploader";
import { AREA, ConsentFields, FIELD, Field, StatusBadge, callApi, useShowcaseErrors } from "./showcase-shared";

export interface TestimonialRow {
  id: string;
  quote: { ar: string; en: string };
  name: { ar: string; en: string };
  role: { ar: string; en: string };
  company: string;
  city: string;
  rating: number;
  photoUrl: string;
  projectSlug: string;
  isSample: boolean;
  consentToPublish: boolean;
  consentNote: string;
  published: boolean;
  order: number;
}

export interface ProjectOption {
  slug: string;
  title: string;
}

const EMPTY: TestimonialRow = {
  id: "",
  quote: { ar: "", en: "" },
  name: { ar: "", en: "" },
  role: { ar: "", en: "" },
  company: "",
  city: "",
  rating: 5,
  photoUrl: "",
  projectSlug: "",
  isSample: false,
  consentToPublish: false,
  consentNote: "",
  published: false,
  order: 0,
};

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const avatar = (url: string) => url.replace("/upload/", "/upload/c_fill,g_face,w_160,h_160,f_auto,q_auto/");

function RatingInput({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled: boolean }) {
  const t = useTranslations("admin.testimonials");
  return (
    <div role="radiogroup" aria-label={t("rating")} className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t("ratingValue", { n })}
          disabled={disabled}
          onClick={() => onChange(n)}
          className="grid size-10 place-items-center rounded-lg hover:bg-surface-muted disabled:opacity-50"
        >
          <Star className={cn("size-7", n <= value ? "fill-warning text-warning" : "text-surface-line")} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function PhotoField({ url, onChange, disabled }: { url: string; onChange: (url: string) => void; disabled: boolean }) {
  const t = useTranslations("admin.testimonials");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type) || file.size > MAX_BYTES) return setError(t("photoHint"));
    setBusy(true);
    const result = await uploadImage(file).catch(() => ({ error: "failed" as const }));
    setBusy(false);
    if (input.current) input.current.value = "";
    if ("url" in result && result.url) return onChange(result.url);
    setError("error" in result && result.error === "not_configured" ? t("photoNotConfigured") : t("photoFailed"));
  }

  return (
    <div className="grid gap-2">
      <span className="text-[15px] font-semibold">{t("photo")}</span>
      <div className="flex items-center gap-4">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted">
          {url ? <Image src={avatar(url)} alt="" fill sizes="64px" className="object-cover" /> : <ImagePlus className="size-6 text-text-muted" aria-hidden="true" />}
        </span>
        <div className="flex flex-wrap gap-2">
          <input ref={input} id="testimonial-photo" type="file" accept={TYPES.join(",")} className="sr-only" disabled={disabled || busy} onChange={(e) => pick(e.target.files)} />
          <label
            htmlFor="testimonial-photo"
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-surface-line ps-4 pe-4 text-[14px] font-semibold hover:border-ink-900 has-[:disabled]:opacity-50"
          >
            {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            {t("photoUpload")}
          </label>
          {url ? (
            <button type="button" disabled={disabled} onClick={() => onChange("")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-4 pe-4 text-[14px] font-semibold hover:border-danger hover:text-danger">
              <X className="size-4" aria-hidden="true" />
              {t("photoRemove")}
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-[13px] text-text-muted">{t("photoHint")}</p>
      {error ? (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TestimonialsView({ items, projects, demo }: { items: TestimonialRow[]; projects: ProjectOption[]; demo: boolean }) {
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
    const { id, isSample, ...body } = form;
    void isSample;
    const done = await run("form", () =>
      id ? callApi(`/api/admin/testimonials/${id}`, "PUT", body) : callApi("/api/admin/testimonials", "POST", body),
    );
    if (done) setForm(null);
  }

  const previewItems = items.map((item) => ({
    id: item.id,
    quote: item.quote,
    name: item.name,
    role: { ar: [item.role.ar, item.company].filter(Boolean).join(" - "), en: [item.role.en || item.role.ar, item.company].filter(Boolean).join(" - ") },
    rating: item.rating,
    photoUrl: item.photoUrl,
    sample: item.isSample,
    project: (() => {
      const project = projects.find((p) => p.slug === item.projectSlug);
      return project ? { slug: project.slug, title: { ar: project.title, en: project.title } } : undefined;
    })(),
  }));

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
            <div className="grid gap-2">
              <span className="text-[15px] font-semibold">{t("rating")}</span>
              <RatingInput value={form.rating} onChange={(n) => set("rating", n)} disabled={busy !== null} />
            </div>
            <Field label={t("project")}>
              <select value={form.projectSlug} onChange={(e) => set("projectSlug", e.target.value)} className={FIELD}>
                <option value="">{t("projectNone")}</option>
                {projects.map((project) => (
                  <option key={project.slug} value={project.slug}>
                    {project.title}
                  </option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <PhotoField url={form.photoUrl} onChange={(url) => set("photoUrl", url)} disabled={busy !== null} />
            </div>
            <Field label={s("order")} hint={s("orderHint")}>
              <input type="number" min={0} max={9999} value={form.order} onChange={(e) => set("order", Number(e.target.value) || 0)} className={FIELD} />
            </Field>
          </div>
          <ConsentFields
            consent={form.consentToPublish}
            note={form.consentNote}
            published={form.published}
            disabled={busy !== null || form.isSample}
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
                <div className="flex items-center gap-3">
                  <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft font-bold text-ink-900">
                    {item.photoUrl ? <Image src={avatar(item.photoUrl)} alt="" fill sizes="48px" className="object-cover" /> : item.name.ar.slice(0, 1)}
                  </span>
                  <div>
                    <b>{item.name.ar}</b>
                    <span className="ms-2 text-[14px] text-text-muted">{[item.role.ar, item.company].filter(Boolean).join(" - ")}</span>
                    <span className="mt-0.5 flex items-center gap-1" dir="ltr" aria-label={t("ratingValue", { n: item.rating })}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cn("size-4", n <= item.rating ? "fill-warning text-warning" : "text-surface-line")} aria-hidden="true" />
                      ))}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.isSample ? <span className="rounded-full bg-warning/15 ps-3 pe-3 py-1 text-[13px] font-bold text-warning">{t("sampleBadge")}</span> : null}
                  <StatusBadge published={item.published} consent={item.consentToPublish} />
                </div>
              </div>
              <p className="text-[15px] leading-[1.8] text-text-muted">{item.quote.ar}</p>
              {item.isSample ? <p className="text-[13px] text-warning">{t("sampleNote")}</p> : null}
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
                {!item.isSample ? (
                  <button
                    type="button"
                    disabled={demo || busy !== null}
                    onClick={() => run(item.id, () => callApi(`/api/admin/testimonials/${item.id}`, "PATCH", { published: !item.published }))}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                  >
                    {item.published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    {item.published ? s("unpublish") : s("publish")}
                  </button>
                ) : null}
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

      {items.length > 0 ? (
        <section className="grid gap-3">
          <div>
            <h2 className="text-[18px] font-bold">{t("previewTitle")}</h2>
            <p className="text-[14px] text-text-muted">{t("previewHint")}</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-surface-line">
            <TestimonialsSection items={previewItems} preview />
          </div>
        </section>
      ) : null}
      {demo ? <p className="text-[14px] text-text-muted">{s("demoNote")}</p> : null}
    </div>
  );
}
