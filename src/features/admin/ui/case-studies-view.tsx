"use client";

import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { AREA, ConsentFields, FIELD, Field, StatusBadge, callApi, useShowcaseErrors } from "./showcase-shared";

type Pair = { ar: string; en: string };

export interface CaseStudyRow {
  slug: string;
  category: "web" | "mobile" | "design";
  title: Pair;
  result: Pair;
  problem: Pair;
  solution: Pair;
  clientName: string;
  clientNameConsent: boolean;
  images: UploadedImage[];
  consentToPublish: boolean;
  consentNote: string;
  published: boolean;
  order: number;
}

const EMPTY: CaseStudyRow = {
  slug: "",
  category: "web",
  title: { ar: "", en: "" },
  result: { ar: "", en: "" },
  problem: { ar: "", en: "" },
  solution: { ar: "", en: "" },
  clientName: "",
  clientNameConsent: false,
  images: [],
  consentToPublish: false,
  consentNote: "",
  published: false,
  order: 0,
};

type PairKey = "title" | "result" | "problem" | "solution";

export function CaseStudiesView({ items, demo }: { items: CaseStudyRow[]; demo: boolean }) {
  const t = useTranslations("admin.caseStudies");
  const s = useTranslations("admin.showcase");
  const errorText = useShowcaseErrors();
  const router = useRouter();
  const [form, setForm] = useState<CaseStudyRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CaseStudyRow>(key: K, value: CaseStudyRow[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const setPair = (key: PairKey, lang: "ar" | "en", value: string) =>
    setForm((f) => (f ? { ...f, [key]: { ...f[key], [lang]: value } } : f));

  async function run(id: string, action: () => Promise<{ ok: boolean; code?: string }>) {
    setBusy(id);
    setError(null);
    const result = await action();
    setBusy(null);
    if (!result.ok) {
      setError(errorText(result.code));
      return false;
    }
    router.refresh();
    return true;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const done = await run("form", () =>
      isNew
        ? callApi("/api/admin/case-studies", "POST", form)
        : callApi(`/api/admin/case-studies/${form.slug}`, "PUT", form),
    );
    if (done) setForm(null);
  }

  const pairField = (key: PairKey, label: string, rows: number, max: number) => (
    <>
      <Field label={`${label} (${s("arabic")})`}>
        <textarea required rows={rows} maxLength={max} value={form?.[key].ar ?? ""} onChange={(e) => setPair(key, "ar", e.target.value)} className={AREA} />
      </Field>
      <Field label={`${label} (${s("english")})`}>
        <textarea rows={rows} maxLength={max} dir="ltr" value={form?.[key].en ?? ""} onChange={(e) => setPair(key, "en", e.target.value)} className={AREA} />
      </Field>
    </>
  );

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
          onClick={() => {
            setIsNew(true);
            setForm({ ...EMPTY });
          }}
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
          <h2 className="text-[18px] font-bold">{isNew ? t("newTitle") : t("editTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("slug")} hint={isNew ? t("slugHint") : t("slugLocked")}>
              <input required dir="ltr" maxLength={60} value={form.slug} disabled={!isNew} onChange={(e) => set("slug", e.target.value.toLowerCase())} className={FIELD} />
            </Field>
            <Field label={t("category")}>
              <select value={form.category} onChange={(e) => set("category", e.target.value as CaseStudyRow["category"])} className={FIELD}>
                <option value="web">{t("categories.web")}</option>
                <option value="mobile">{t("categories.mobile")}</option>
                <option value="design">{t("categories.design")}</option>
              </select>
            </Field>
            {pairField("title", t("titleField"), 2, 140)}
            {pairField("result", t("result"), 3, 400)}
            <p className="rounded-xl bg-warning/10 p-3 text-[14px] text-warning md:col-span-2">{t("resultWarning")}</p>
            {pairField("problem", t("problem"), 6, 3000)}
            {pairField("solution", t("solution"), 6, 3000)}
            <Field label={t("clientName")}>
              <input maxLength={100} value={form.clientName} onChange={(e) => set("clientName", e.target.value)} className={FIELD} />
            </Field>
            <label className="flex items-start gap-3 self-end pb-3 text-[15px]">
              <input
                type="checkbox"
                checked={form.clientNameConsent}
                onChange={(e) => set("clientNameConsent", e.target.checked)}
                className="mt-1 size-5"
              />
              <span>
                <b>{t("clientNameConsent")}</b>
                <span className="block text-[13px] text-text-muted">{t("clientNameConsentHint")}</span>
              </span>
            </label>
            <ImageUploader images={form.images} disabled={busy !== null} onChange={(images) => set("images", images)} />
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
            <li key={item.slug} className="grid gap-3 rounded-2xl border border-surface-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b>{item.title.ar}</b>
                  <span className="ms-2 text-[14px] text-text-muted" dir="ltr">
                    /work/{item.slug}
                  </span>
                </div>
                <StatusBadge published={item.published} consent={item.consentToPublish} />
              </div>
              {item.images?.[0] ? (
                <div className="relative aspect-[16/7] max-w-md overflow-hidden rounded-xl bg-surface-muted">
                  <Image src={item.images[0].url} alt="" fill sizes="448px" className="object-cover" />
                </div>
              ) : null}
              <p className="text-[15px] font-semibold">{item.result.ar}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={demo || busy !== null}
                  onClick={() => {
                    setIsNew(false);
                    setForm(item);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  {s("edit")}
                </button>
                <button
                  type="button"
                  disabled={demo || busy !== null}
                  onClick={() => run(item.slug, () => callApi(`/api/admin/case-studies/${item.slug}`, "PATCH", { published: !item.published }))}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                >
                  {item.published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  {item.published ? s("unpublish") : s("publish")}
                </button>
                <button
                  type="button"
                  disabled={demo || busy !== null}
                  onClick={() => {
                    if (window.confirm(s("confirmDelete"))) run(item.slug, () => callApi(`/api/admin/case-studies/${item.slug}`, "DELETE"));
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
