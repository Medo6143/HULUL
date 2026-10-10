import { CalendarCheck, Percent, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { LeadStatusKey } from "../model/admin-lead";
import type { DayPoint, OverviewKpis } from "../model/dashboard";
import { AreaChart, ColumnChart, DonutChart, type DonutSlice } from "./charts";

export interface OverviewData {
  kpis: OverviewKpis;
  leads30: DayPoint[];
  bookings14: DayPoint[];
  statuses: { status: LeadStatusKey; value: number }[];
  sources: { source: string; leads: number }[];
}

const SLICE: Record<LeadStatusKey, { stroke: string; dot: string }> = {
  new: { stroke: "stroke-brand", dot: "bg-brand" },
  contacted: { stroke: "stroke-ink-700", dot: "bg-ink-700" },
  consultation: { stroke: "stroke-brand-strong", dot: "bg-brand-strong" },
  proposal: { stroke: "stroke-warning", dot: "bg-warning" },
  negotiation: { stroke: "stroke-ink-900", dot: "bg-ink-900" },
  won: { stroke: "stroke-success", dot: "bg-success" },
  lost: { stroke: "stroke-danger", dot: "bg-danger" },
  parked: { stroke: "stroke-text-muted", dot: "bg-text-muted" },
};

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-6">
      <div>
        <h2 className="text-[18px] font-bold">{title}</h2>
        {hint ? <p className="text-[14px] text-text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-line bg-surface p-5">
      <div className="flex items-center gap-3 text-text-muted">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-ink-900">{icon}</span>
        <span className="text-[15px] font-semibold">{label}</span>
      </div>
      <p className="mt-3 text-[34px] font-bold leading-none tabular-nums">{value}</p>
      {note ? <p className="mt-2 text-[14px] text-text-muted">{note}</p> : null}
    </div>
  );
}

const shortDate = (date: string) => date.slice(5).replace("-", "/");

/** The landing page of the admin: headline numbers and charts, all computed from real leads and bookings. */
export function OverviewView({ data }: { data: OverviewData }) {
  const t = useTranslations("admin.overview");
  const s = useTranslations("admin.status");
  const src = useTranslations("admin.sources");
  const { kpis } = data;

  const diff = kpis.last7 - kpis.previous7;
  const slices: DonutSlice[] = data.statuses.map((entry) => ({
    label: s(entry.status),
    value: entry.value,
    ...SLICE[entry.status],
  }));
  const sourcesMax = Math.max(...data.sources.map((x) => x.leads), 1);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
        <p className="mt-1 text-text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<Users className="size-5" aria-hidden="true" />}
          label={t("kpi.last7")}
          value={String(kpis.last7)}
          note={
            <span className="inline-flex items-center gap-1">
              {diff >= 0 ? <TrendingUp className="size-4 text-success" aria-hidden="true" /> : <TrendingDown className="size-4 text-danger" aria-hidden="true" />}
              {t("kpi.vsPrevious", { diff: `${diff >= 0 ? "+" : ""}${diff}` })}
            </span>
          }
        />
        <Kpi icon={<Users className="size-5" aria-hidden="true" />} label={t("kpi.total")} value={String(kpis.total)} />
        <Kpi icon={<CalendarCheck className="size-5" aria-hidden="true" />} label={t("kpi.bookings")} value={String(kpis.upcomingBookings)} />
        <Kpi
          icon={kpis.winRatePercent === null ? <Trophy className="size-5" aria-hidden="true" /> : <Percent className="size-5" aria-hidden="true" />}
          label={t("kpi.won")}
          value={String(kpis.won)}
          note={kpis.winRatePercent === null ? undefined : t("kpi.winRate", { percent: kpis.winRatePercent })}
        />
      </div>

      <Panel title={t("leadsOverTime")} hint={t("leadsOverTimeHint")}>
        <AreaChart
          points={data.leads30.map((p) => ({ label: shortDate(p.date), value: p.value }))}
          summary={t("leadsOverTimeSummary", { total: data.leads30.reduce((n, p) => n + p.value, 0) })}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("byStatus")} hint={t("byStatusHint")}>
          {slices.length === 0 ? (
            <p className="text-text-muted">{t("empty")}</p>
          ) : (
            <DonutChart slices={slices} center={t("leadsWord")} summary={t("byStatus")} />
          )}
        </Panel>
        <Panel title={t("upcomingBookings")} hint={t("upcomingBookingsHint")}>
          <ColumnChart
            points={data.bookings14.map((p) => ({ label: shortDate(p.date), value: p.value }))}
            summary={t("upcomingBookingsSummary", { total: data.bookings14.reduce((n, p) => n + p.value, 0) })}
          />
        </Panel>
      </div>

      <Panel title={t("bySource")}>
        {data.sources.length === 0 ? (
          <p className="text-text-muted">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3">
            {data.sources.map((row) => (
              <li key={row.source} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-[15px]">
                <span>{src(row.source as "google")}</span>
                <span className="h-3 overflow-hidden rounded-full bg-surface-muted">
                  <span className="block h-full rounded-full bg-brand-strong" style={{ width: `${(row.leads / sourcesMax) * 100}%` }} />
                </span>
                <b className="tabular-nums">{row.leads}</b>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
