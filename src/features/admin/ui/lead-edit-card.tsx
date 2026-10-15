"use client";

import { Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type { AdminLeadDetail } from "../model/admin-lead";
import { FIELD, AREA, Field, callApi } from "./showcase-shared";
import { useAdminFeedback, useFlash } from "./feedback";

const ERRORS = ["invalid_name", "invalid_phone", "invalid_email", "invalid_input", "not_found", "unauthorized", "forbidden"];

/** Staff correct a lead's contact and request details; the owner can also delete the lead. */
export function LeadEditCard({ lead, demo, canDelete }: { lead: AdminLeadDetail; demo: boolean; canDelete: boolean }) {
  const t = useTranslations("admin.lead");
  const { confirm } = useAdminFeedback();
  const svc = useTranslations("start.services");
  const ch = useTranslations("start.channels");
  const tl = useTranslations("start.timelines");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useFlash();
  const [form, setForm] = useState({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    service: lead.service,
    preferredContact: lead.preferred,
    businessType: lead.business,
    timeline: lead.timeline,
    description: lead.description,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const errorText = (code?: string) => (ERRORS.includes(code ?? "") ? t(`editErrors.${code}`) : t("editErrors.generic"));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await callApi(`/api/admin/leads/${lead.id}`, "PATCH", form);
    setBusy(false);
    if (!result.ok) return setMessage({ ok: false, text: errorText(result.code) });
    setMessage({ ok: true, text: t("edited") });
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    if (!(await confirm({ message: t("confirmDelete", { name: lead.name }), confirmLabel: t("delete"), tone: "danger" }))) return;
    setBusy(true);
    const result = await callApi(`/api/admin/leads/${lead.id}`, "DELETE");
    setBusy(false);
    if (!result.ok) return setMessage({ ok: false, text: errorText(result.code) });
    router.replace("/admin/leads");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={demo}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-4 pe-4 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
        >
          <Pencil className="size-4" aria-hidden="true" />
          {open ? t("cancel") : t("editData")}
        </button>
        {canDelete ? (
          <button
            type="button"
            disabled={demo || busy}
            onClick={remove}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-4 pe-4 text-[14px] font-semibold text-danger hover:border-danger disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t("delete")}
          </button>
        ) : null}
      </div>
      {open ? (
        <form onSubmit={save} className="grid gap-4 rounded-xl bg-surface-muted p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("editFields.name")}>
              <input required maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} className={FIELD} />
            </Field>
            <Field label={t("editFields.phone")}>
              <input required dir="ltr" maxLength={30} value={form.phone} onChange={(e) => set("phone", e.target.value)} className={FIELD} />
            </Field>
            <Field label={t("editFields.email")}>
              <input type="email" dir="ltr" maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} className={FIELD} />
            </Field>
            <Field label={t("editFields.service")}>
              <select value={form.service} onChange={(e) => set("service", e.target.value as typeof form.service)} className={FIELD}>
                {(["web", "mobile", "design", "unsure"] as const).map((key) => (
                  <option key={key} value={key}>
                    {svc(key)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("editFields.preferred")}>
              <select value={form.preferredContact} onChange={(e) => set("preferredContact", e.target.value as typeof form.preferredContact)} className={FIELD}>
                {(["whatsapp", "call", "email"] as const).map((key) => (
                  <option key={key} value={key}>
                    {ch(key)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("editFields.business")}>
              <input maxLength={100} value={form.businessType} onChange={(e) => set("businessType", e.target.value)} className={FIELD} />
            </Field>
            <Field label={t("editFields.timeline")}>
              <select value={form.timeline} onChange={(e) => set("timeline", e.target.value as typeof form.timeline)} className={FIELD}>
                <option value="">-</option>
                {(["asap", "months", "flexible"] as const).map((key) => (
                  <option key={key} value={key}>
                    {tl(key)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t("editFields.description")}>
            <textarea rows={4} maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)} className={AREA} />
          </Field>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-ink-900 ps-5 pe-5 font-semibold text-surface hover:bg-ink-800 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            {t("save")}
          </button>
        </form>
      ) : null}
      {message ? (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-[14px] text-success" : "text-[14px] text-danger"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
