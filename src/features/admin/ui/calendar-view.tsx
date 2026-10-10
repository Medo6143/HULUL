"use client";

import { CalendarCheck, Loader2, UserCheck, UserX, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { callApi } from "./showcase-shared";

export interface BookingRow {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  email: string;
  startUtc: string;
  endUtc: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
}

const dayFormat = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Riyadh",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Riyadh" });
const dateKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(iso));

const TONE: Record<BookingRow["status"], string> = {
  confirmed: "bg-brand-soft text-ink-900",
  completed: "bg-success/10 text-success",
  no_show: "bg-warning/10 text-warning",
  cancelled: "bg-danger/10 text-danger",
};

export function CalendarView({ bookings, nowIso, demo }: { bookings: BookingRow[]; nowIso: string; demo: boolean }) {
  const t = useTranslations("admin.calendar");
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date(nowIso).getTime();
  const upcoming = bookings.filter((b) => new Date(b.endUtc).getTime() >= now);
  const past = bookings.filter((b) => new Date(b.endUtc).getTime() < now).reverse();
  const shown = tab === "upcoming" ? upcoming : past;

  const groups = new Map<string, BookingRow[]>();
  for (const booking of shown) {
    const key = dateKey(booking.startUtc);
    groups.set(key, [...(groups.get(key) ?? []), booking]);
  }

  async function setStatus(id: string, status: BookingRow["status"]) {
    setBusy(id);
    setError(null);
    const result = await callApi(`/api/admin/bookings/${id}`, "PATCH", { status });
    setBusy(null);
    if (!result.ok) return setError(result.code === "not_allowed" ? t("errors.not_allowed") : t("errors.generic"));
    router.refresh();
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
          <p className="mt-1 text-text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/admin/availability"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-line ps-4 pe-4 font-semibold hover:border-ink-900"
        >
          <CalendarCheck className="size-4" aria-hidden="true" />
          {t("manageAvailability")}
        </Link>
      </div>

      <div role="tablist" className="flex gap-2">
        {(["upcoming", "past"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "min-h-11 rounded-xl border ps-5 pe-5 font-semibold",
              tab === key ? "border-ink-900 bg-ink-900 text-surface" : "border-surface-line bg-surface hover:border-ink-900",
            )}
          >
            {t(`tabs.${key}`)} ({key === "upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-[15px] text-danger">
          {error}
        </p>
      ) : null}

      {groups.size === 0 ? (
        <p className="rounded-2xl border border-dashed border-text-muted/30 bg-surface p-10 text-center text-text-muted">
          {tab === "upcoming" ? t("emptyUpcoming") : t("emptyPast")}
        </p>
      ) : (
        [...groups.entries()].map(([key, rows]) => (
          <section key={key} className="grid gap-3">
            <h2 className="text-[17px] font-bold">{dayFormat.format(new Date(rows[0]!.startUtc))}</h2>
            <ul className="grid gap-3">
              {rows.map((b) => (
                <li key={b.id} className="grid gap-3 rounded-2xl border border-surface-line bg-surface p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <div dir="ltr" className="text-[20px] font-bold tabular-nums">
                    {timeFormat.format(new Date(b.startUtc))}
                    <span className="text-text-muted"> - {timeFormat.format(new Date(b.endUtc))}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{b.name}</b>
                      <span className={cn("rounded-full ps-3 pe-3 py-0.5 text-[13px] font-semibold", TONE[b.status])}>{t(`status.${b.status}`)}</span>
                    </div>
                    <p className="text-[14px] text-text-muted" dir="ltr">
                      {b.phone}
                      {b.email ? ` | ${b.email}` : ""}
                    </p>
                    {b.leadId ? (
                      <Link href={`/admin/leads/${b.leadId}`} className="text-[14px] font-semibold text-brand-strong underline">
                        {t("openLead")}
                      </Link>
                    ) : null}
                  </div>
                  {b.status === "confirmed" ? (
                    <div className="flex flex-wrap gap-2">
                      {busy === b.id ? <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden="true" /> : null}
                      <button
                        type="button"
                        disabled={demo || busy !== null}
                        onClick={() => setStatus(b.id, "completed")}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                      >
                        <UserCheck className="size-4" aria-hidden="true" />
                        {t("actions.completed")}
                      </button>
                      <button
                        type="button"
                        disabled={demo || busy !== null}
                        onClick={() => setStatus(b.id, "no_show")}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:opacity-50"
                      >
                        <UserX className="size-4" aria-hidden="true" />
                        {t("actions.no_show")}
                      </button>
                      <button
                        type="button"
                        disabled={demo || busy !== null}
                        onClick={() => {
                          if (window.confirm(t("confirmCancel"))) setStatus(b.id, "cancelled");
                        }}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-line ps-3 pe-3 text-[14px] font-semibold text-danger hover:border-danger disabled:opacity-50"
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        {t("actions.cancelled")}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      {demo ? <p className="text-[14px] text-text-muted">{t("demoNote")}</p> : null}
    </div>
  );
}
