import { ArrowDownRight, ArrowUpRight, Clock, MessageSquareReply } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  demoChannels,
  demoFirstReplyHours,
  demoFunnel,
  demoKpis,
  demoLosses,
  demoServices,
  demoSources,
} from "../demo/demo-analytics";
import { statusDot } from "./status-badge";

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-surface-line bg-surface p-6">
      <h2 className="text-[18px] font-bold">{title}</h2>
      {hint ? <p className="mb-4 text-[14px] text-text-muted">{hint}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

function Bar({ label, value, max, tone = "bg-brand-strong" }: { label: string; value: number; max: number; tone?: string }) {
  return (
    <li className="grid gap-1.5">
      <span className="flex items-center justify-between text-[15px]">
        <span>{label}</span>
        <b>{value}</b>
      </span>
      <span className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
        <span
          className={cn("block h-full rounded-full", tone)}
          style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
        />
      </span>
    </li>
  );
}

function Delta({ value, goodWhenDown = false }: { value: number; goodWhenDown?: boolean }) {
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ps-2 pe-2 text-[13px] font-semibold",
        good ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
      )}
    >
      <Icon className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
      <bdi>{Math.abs(value)}</bdi>
    </span>
  );
}

/** All numbers come from demo-analytics.ts and are invented for layout only. */
export function AnalyticsView() {
  const t = useTranslations("admin.analytics");
  const s = useTranslations("admin.status");
  const src = useTranslations("admin.sources");
  const svc = useTranslations("start.services");
  const lr = useTranslations("admin.lostReasons");

  const funnelMax = demoFunnel[0].count;
  const sourceMax = Math.max(...demoSources.map((x) => x.leads));
  const serviceMax = Math.max(...demoServices.map((x) => x.value));
  const lossMax = Math.max(...demoLosses.map((x) => x.value));
  const channelTotal = demoChannels.form + demoChannels.whatsapp;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
          <p className="mt-1 text-text-muted">{t("subtitle")}</p>
        </div>
        <span className="inline-flex min-h-11 items-center rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-[15px] font-semibold">
          {t("range")}
        </span>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {demoKpis.map((kpi) => (
          <li key={kpi.key} className="rounded-2xl border border-surface-line bg-surface p-5">
            <p className="text-[14px] text-text-muted">{t(`kpi.${kpi.key}`)}</p>
            <p className="mt-2 text-[34px] font-bold leading-none">
              <bdi>{kpi.value}</bdi>
            </p>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-text-muted">
              <Delta value={kpi.delta} />
              {t("vsPrev")}
            </p>
          </li>
        ))}
        <li className="rounded-2xl bg-ink-900 p-5 text-surface">
          <p className="flex items-center gap-2 text-[14px] text-surface/70">
            <Clock className="size-4" aria-hidden="true" />
            {t("kpi.firstReply")}
          </p>
          <p className="mt-2 text-[34px] font-bold leading-none">
            <bdi>{demoFirstReplyHours.median}</bdi> <span className="text-[16px] font-medium text-surface/70">{t("hours")}</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-[13px] text-surface/70">
            <Delta value={demoFirstReplyHours.delta} goodWhenDown />
            {t("vsPrev")}
          </p>
        </li>
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("funnel")} hint={t("funnelHint")}>
          <ol className="grid gap-4">
            {demoFunnel.map((step, index) => {
              const prev = index === 0 ? null : demoFunnel[index - 1]!.count;
              const rate = prev ? Math.round((step.count / prev) * 100) : null;
              return (
                <li key={step.status} className="grid gap-1.5">
                  <span className="flex items-center justify-between text-[15px]">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={cn("size-2.5 rounded-full", statusDot[step.status])} />
                      {s(step.status)}
                    </span>
                    <span className="flex items-center gap-3">
                      {rate !== null ? <span className="text-[13px] text-text-muted"><bdi>{rate}%</bdi></span> : null}
                      <b>{step.count}</b>
                    </span>
                  </span>
                  <span className="h-3 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand-strong to-brand"
                      style={{ width: `${(step.count / funnelMax) * 100}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel title={t("sources")} hint={t("sourcesHint")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-start">
              <thead>
                <tr className="text-[13px] text-text-muted">
                  <th scope="col" className="pb-2 text-start font-semibold">{t("sources")}</th>
                  <th scope="col" className="pb-2 text-start font-semibold">{t("leadsCol")}</th>
                  <th scope="col" className="pb-2 text-end font-semibold">{t("dealsCol")}</th>
                </tr>
              </thead>
              <tbody>
                {demoSources.map((row) => (
                  <tr key={row.source} className="border-t border-surface-line">
                    <td className="py-3 text-[15px]">{src(row.source)}</td>
                    <td className="py-3 pe-4">
                      <span className="flex items-center gap-3">
                        <span className="h-2 w-24 overflow-hidden rounded-full bg-surface-muted">
                          <span
                            className="block h-full rounded-full bg-brand-strong"
                            style={{ width: `${(row.leads / sourceMax) * 100}%` }}
                          />
                        </span>
                        <b className="text-[15px]">{row.leads}</b>
                      </span>
                    </td>
                    <td className="py-3 text-end">
                      <span
                        className={cn(
                          "inline-grid min-w-8 place-items-center rounded-full ps-2 pe-2 text-[14px] font-bold",
                          row.deals > 0 ? "bg-success/10 text-success" : "bg-surface-muted text-text-muted",
                        )}
                      >
                        {row.deals}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={t("services")}>
          <ul className="grid gap-4">
            {demoServices.map((row) => (
              <Bar key={row.key} label={svc(row.key)} value={row.value} max={serviceMax} />
            ))}
          </ul>
        </Panel>

        <Panel title={t("channels")}>
          <div className="flex h-4 overflow-hidden rounded-full bg-surface-muted">
            <span className="bg-ink-900" style={{ width: `${(demoChannels.form / channelTotal) * 100}%` }} />
            <span className="bg-whatsapp" style={{ width: `${(demoChannels.whatsapp / channelTotal) * 100}%` }} />
          </div>
          <ul className="mt-5 grid gap-3 text-[15px]">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full bg-ink-900" />
                {t("form")}
              </span>
              <b>{demoChannels.form}</b>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full bg-whatsapp" />
                {t("whatsapp")}
              </span>
              <b>{demoChannels.whatsapp}</b>
            </li>
          </ul>
        </Panel>

        <Panel title={t("losses")}>
          <ul className="grid gap-4">
            {demoLosses.map((row) => (
              <Bar key={row.key} label={lr(row.key)} value={row.value} max={lossMax} tone="bg-danger/70" />
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={t("sla")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-xl bg-surface-muted p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-ink-900 text-brand">
              <Clock className="size-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[14px] text-text-muted">{t("slaMedian")}</span>
              <b className="text-[24px]">
                <bdi>{demoFirstReplyHours.median}</bdi> {t("hours")}
              </b>
            </span>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-surface-muted p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-danger/10 text-danger">
              <MessageSquareReply className="size-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[14px] text-text-muted">{t("slaOver")}</span>
              <b className="text-[24px]">
                <bdi>{demoFirstReplyHours.overLimit}</bdi>
              </b>
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
