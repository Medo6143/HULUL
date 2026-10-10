import { ArrowRight, Clock, Mail, Phone, StickyNote, UserRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { isLostReasonKey, type AdminLeadDetail } from "../model/admin-lead";
import { formatDateTime } from "./format";
import { NoteForm, StatusActions } from "./lead-actions";
import { InviteCard, type InviteCardData } from "./invite-card";
import { StatusBadge } from "./status-badge";

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-surface-line bg-surface p-6">
      <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-surface-line py-3 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-[14px] text-text-muted">{label}</dt>
      <dd className="text-[16px]">{children}</dd>
    </div>
  );
}

/**
 * Lead detail. `whatsappHref` is null for demo rows (their numbers are fake) and for leads without a valid number.
 * `demo` disables the write actions.
 */
export function LeadDetail({
  lead,
  demo,
  whatsappHref,
  invite,
}: {
  lead: AdminLeadDetail;
  demo: boolean;
  whatsappHref: string | null;
  invite: InviteCardData | null;
}) {
  const t = useTranslations("admin.lead");
  const src = useTranslations("admin.sources");
  const svc = useTranslations("start.services");
  const tl = useTranslations("start.timelines");
  const ch = useTranslations("start.channels");
  const lr = useTranslations("admin.lostReasons");

  const whatsappClass =
    "inline-flex min-h-12 items-center gap-2 rounded-xl bg-whatsapp ps-5 pe-5 font-semibold text-ink-950";

  return (
    <div className="grid gap-6">
      <Link
        href="/admin/leads"
        className="inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-text-muted hover:text-text"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
        {t("back")}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-surface-line bg-surface p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong text-[24px] font-bold text-ink-950">
            {lead.name.slice(-1)}
          </span>
          <div>
            <h1 className="text-[26px] font-bold leading-[1.3]">{lead.name}</h1>
            <p className="text-text-muted">{lead.business}</p>
            <p className="mt-1 flex items-center gap-2 text-[14px] text-text-muted">
              <Clock className="size-4" aria-hidden="true" />
              {t("received")} {formatDateTime(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={lead.status} />
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={whatsappClass}>
              <WhatsAppIcon className="size-5" aria-hidden="true" />
              {t("whatsapp")}
            </a>
          ) : (
            <span title={t("whatsappDemo")} className={`${whatsappClass} opacity-50`}>
              <WhatsAppIcon className="size-5" aria-hidden="true" />
              {t("whatsapp")}
            </span>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <Card title={t("contact")}>
            <dl>
              <Row label={t("phone")}>
                <span className="inline-flex items-center gap-2" dir="ltr">
                  <Phone className="size-4 text-text-muted" aria-hidden="true" />
                  {lead.phone}
                </span>
              </Row>
              <Row label={t("email")}>
                {lead.email ? (
                  <span className="inline-flex items-center gap-2" dir="ltr">
                    <Mail className="size-4 text-text-muted" aria-hidden="true" />
                    {lead.email}
                  </span>
                ) : (
                  <span className="text-text-muted">{t("noEmail")}</span>
                )}
              </Row>
              <Row label={t("preferred")}>{ch(lead.preferred)}</Row>
            </dl>
          </Card>

          <Card title={t("request")}>
            <dl>
              <Row label={t("service")}>{svc(lead.service)}</Row>
              <Row label={t("business")}>{lead.business || "-"}</Row>
              <Row label={t("timeline")}>{lead.timeline ? tl(lead.timeline) : "-"}</Row>
              <Row label={t("description")}>{lead.description || "-"}</Row>
            </dl>
          </Card>

          {invite ? (
            <Card title={t("inviteTitle")}>
              <InviteCard
                leadId={lead.id}
                leadName={lead.name}
                phone={lead.phone}
                email={lead.email}
                locale={lead.locale ?? "ar"}
                data={invite}
                demo={demo}
              />
            </Card>
          ) : null}

          <Card title={t("source")}>
            <dl>
              <Row label={t("source")}>{src(lead.source)}</Row>
              <Row label={t("campaign")}>
                <span dir="ltr">{lead.campaign || "-"}</span>
              </Row>
              <Row label={t("landing")}>
                <span dir="ltr">{lead.landing || "-"}</span>
              </Row>
            </dl>
          </Card>

          <Card title={t("notesTitle")} icon={<StickyNote className="size-5 text-brand-strong" aria-hidden="true" />}>
            <ul className="mb-5 grid gap-3">
              {lead.notes.map((note) => (
                <li key={note.id} className="rounded-xl bg-surface-muted p-4">
                  <p className="whitespace-pre-wrap">{note.text}</p>
                  <p className="mt-2 text-[13px] text-text-muted">
                    {t("by")} {note.by} · {formatDateTime(note.at)}
                  </p>
                </li>
              ))}
            </ul>
            <NoteForm leadId={lead.id} demo={demo} />
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title={t("statusTitle")}>
            <StatusActions leadId={lead.id} status={lead.status} demo={demo} />
            {lead.lostReason ? (
              <p className="mt-4 text-[15px]">
                <b>{t("lostReason")}:</b> {isLostReasonKey(lead.lostReason) ? lr(lead.lostReason) : lead.lostReason}
              </p>
            ) : null}
            <div className="mt-5 flex items-center gap-3 border-t border-surface-line pt-4 text-[15px]">
              <UserRound className="size-5 text-text-muted" aria-hidden="true" />
              <span className="text-text-muted">{t("assigned")}:</span>
              <b>{lead.assigned || t("unassigned")}</b>
            </div>
          </Card>

          <Card title={t("historyTitle")}>
            <ol className="relative grid gap-5 ps-6 before:absolute before:inset-y-1 before:start-[7px] before:w-px before:bg-surface-line">
              {[...lead.history].reverse().map((entry) => (
                <li key={`${entry.to}-${entry.at}`} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -start-6 top-1.5 size-[15px] rounded-full border-[3px] border-surface bg-brand-strong"
                  />
                  <StatusBadge status={entry.to} />
                  <p className="mt-1 text-[13px] text-text-muted">
                    {entry.by ? `${t("by")} ${entry.by} · ` : ""}
                    {formatDateTime(entry.at)}
                  </p>
                  {entry.reason ? (
                    <p className="text-[14px]">{isLostReasonKey(entry.reason) ? lr(entry.reason) : entry.reason}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
