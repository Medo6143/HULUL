"use client";

import { Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { pickText, renderTemplate, whatsappLink, type InviteTemplates } from "@/features/templates";
import { AREA, FIELD, Field, callApi } from "./showcase-shared";

export interface InviteCardData {
  templates: InviteTemplates;
  meetingLink: string;
  company: { ar: string; en: string };
  /** Display name of the lead's requested service, per language. */
  service: { ar: string; en: string };
}

const formatDate = (key: string, locale: "ar" | "en") =>
  key
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Asia/Riyadh",
      }).format(new Date(`${key}T12:00:00+03:00`))
    : "";

/** Consultation invitation on the lead page: fill in a time, review the text, then open WhatsApp or send the email. */
export function InviteCard({
  leadName,
  phone,
  email,
  locale: leadLocale,
  data,
  demo,
  leadId,
}: {
  leadName: string;
  phone: string;
  email: string;
  locale: "ar" | "en";
  data: InviteCardData;
  demo: boolean;
  leadId: string;
}) {
  const t = useTranslations("admin.invite");
  const [locale, setLocale] = useState<"ar" | "en">(leadLocale);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLink, setMeetingLink] = useState(data.meetingLink);
  const [edited, setEdited] = useState<{ wa?: string; subject?: string; body?: string }>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const values = useMemo(
    () => ({ name: leadName, service: data.service[locale], date: formatDate(date, locale), time, meetingLink, company: data.company[locale] }),
    [leadName, data, locale, date, time, meetingLink],
  );
  const generated = useMemo(
    () => ({
      wa: renderTemplate(pickText(data.templates.whatsapp, locale), values),
      subject: renderTemplate(pickText(data.templates.emailSubject, locale), values),
      body: renderTemplate(pickText(data.templates.emailBody, locale), values),
    }),
    [data.templates, locale, values],
  );
  // The staff member's edits win until they change an input, which regenerates the text.
  const wa = edited.wa ?? generated.wa;
  const subject = edited.subject ?? generated.subject;
  const body = edited.body ?? generated.body;
  const reset = () => setEdited({});
  const waHref = demo ? null : whatsappLink(phone, wa);

  async function sendEmail() {
    setBusy(true);
    setMessage(null);
    const result = await callApi(`/api/admin/leads/${leadId}/invite-email`, "POST", { subject, body });
    setBusy(false);
    if (result.ok) return setMessage({ ok: true, text: t("emailSent") });
    const known = ["no_email", "not_found", "send_failed", "invalid_input"];
    setMessage({ ok: false, text: known.includes(result.code ?? "") ? t(`errors.${result.code}`) : t("errors.generic") });
  }

  const link = "inline-flex min-h-11 items-center gap-2 rounded-xl ps-5 pe-5 font-semibold";

  return (
    <div className="grid gap-4">
      <p className="text-[14px] text-text-muted">{t("hint")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("language")}>
          <select
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value as "ar" | "en");
              reset();
            }}
            className={FIELD}
          >
            <option value="ar">{t("ar")}</option>
            <option value="en">{t("en")}</option>
          </select>
        </Field>
        <Field label={t("date")}>
          <input type="date" dir="ltr" value={date} onChange={(e) => (setDate(e.target.value), reset())} className={FIELD} />
        </Field>
        <Field label={t("time")}>
          <input type="time" dir="ltr" value={time} onChange={(e) => (setTime(e.target.value), reset())} className={FIELD} />
        </Field>
        <Field label={t("meetingLink")}>
          <input type="url" dir="ltr" value={meetingLink} onChange={(e) => (setMeetingLink(e.target.value), reset())} className={FIELD} />
        </Field>
      </div>

      <Field label={t("whatsappText")}>
        <textarea rows={6} value={wa} onChange={(e) => setEdited((x) => ({ ...x, wa: e.target.value }))} className={AREA} />
      </Field>
      {waHref ? (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${link} w-fit bg-whatsapp text-ink-950`}>
          <WhatsAppIcon className="size-5" aria-hidden="true" />
          {t("openWhatsapp")}
        </a>
      ) : (
        <span className={`${link} w-fit bg-whatsapp text-ink-950 opacity-50`}>
          <WhatsAppIcon className="size-5" aria-hidden="true" />
          {t("openWhatsapp")}
        </span>
      )}

      <div className="grid gap-3 border-t border-surface-line pt-4">
        <Field label={t("emailSubject")}>
          <input value={subject} maxLength={150} onChange={(e) => setEdited((x) => ({ ...x, subject: e.target.value }))} className={FIELD} />
        </Field>
        <Field label={t("emailBody")}>
          <textarea rows={8} value={body} onChange={(e) => setEdited((x) => ({ ...x, body: e.target.value }))} className={AREA} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={demo || busy || !email}
            onClick={sendEmail}
            className={`${link} bg-ink-900 text-surface hover:bg-ink-800 disabled:opacity-50`}
          >
            {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
            {t("sendEmail")}
          </button>
          {!email ? <span className="text-[14px] text-text-muted">{t("noEmail")}</span> : <span className="text-[14px] text-text-muted" dir="ltr">{email}</span>}
        </div>
        {message ? (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-success" : "text-danger"}>
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
