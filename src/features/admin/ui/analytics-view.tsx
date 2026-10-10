import { ArrowDownRight, ArrowUpRight, Clock, MessageSquareReply } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AnalyticsData } from "../model/analytics";
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

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-surface-line p-6 text-center text-[15px] text-text-muted">{text}</p>;
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
          style={{ width: `${Math.max(4, max === 0 ? 0 : (value / max) * 100)}%` }}
        />
      </span>
    </li>
  );
}

function Delta({ value, goodWhenDown = false }: { value: number; goodWhenDown?: boolean }) {
  const up = value >= 0;
  const good = value === 0 ? true : goodWhenDown ? !up : up;
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

/** Renders numbers computed from the leads (real or demo). Nothing here is invented. */
export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const t = useTranslations("admin.analytics");
  const s = useTranslations("admin.status");
  const src = useTranslations("admin.sources");
  const svc = useTranslations("start.services");
  const ch = useTranslations("start.channels");
  const lr = useTranslations("admin.lostReasons");

  const funnelMax = Math.max(1, data.funnel[0]?.count ?? 0);
  const sourceMax = Math.max(1, ...data.sources.map((x) => x.leads));
  const serviceMax = Math.max(1, ...data.services.map((x) => x.value));
  const lossMax = Math.max(1, ...data.losses.map((x) => x.value));
  const contactMax = Math.max(1, ...data.contact.map((x) => x.value));
  const { firstReply } = data;

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
        {data.kpis.map((kpi) => (
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
          {firstReply.medianHours === null ? (
            <p className="mt-2 text-[20px] font-semibold text-surface/80">{t("noData")}</p>
          ) : (
            <>
              <p className="mt-2 text-[34px] font-bold leading-none">
                <bdi>{firstReply.medianHours}</bdi>{" "}
                <span className="text-[16px] font-medium text-surface/70">{t("hours")}</span>
              </p>
              {firstReply.deltaHours !== null ? (
                <p className="mt-3 flex items-center gap-2 text-[13px] text-surface/70">
                  <Delta value={firstReply.deltaHours} goodWhenDown />
                  {t("vsPrev")}
                </p>
              ) : null}
            </>
          )}
        </li>
      </ul>

      <p className="text-[13px] text-text-muted">{t("approxNote")}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("funnel")} hint={t("funnelHint")}>
          <ol className="grid gap-4">
            {data.funnel.map((step, index) => {
              const prev = index === 0 ? null : data.funnel[index - 1]!.count;
              const rate = prev ? Math.round((step.count / prev) * 100) : null;
              return (
                <li key={step.status} className="grid gap-1.5">
                  <span className="flex items-center justify-between text-[15px]">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={cn("size-2.5 rounded-full", statusDot[step.status])} />
                      {s(step.status)}
                    </span>
                    <span className="flex items-center gap-3">
                      {rate !== null ? (
                        <span className="text-[13px] text-text-muted">
                          <bdi>{rate}%</bdi>
                        </span>
                      ) : null}
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
          {data.sources.length === 0 ? (
            <Empty text={t("noData")} />
          ) : (
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
                  {data.sources.map((row) => (
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
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={t("services")}>
          {data.services.length === 0 ? (
            <Empty text={t("noData")} />
          ) : (
            <ul className="grid gap-4">
              {data.services.map((row) => (
                <Bar key={row.key} label={svc(row.key)} value={row.value} max={serviceMax} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("contactTitle")}>
          <ul className="grid gap-4">
            {data.contact.map((row) => (
              <Bar key={row.key} label={ch(row.key)} value={row.value} max={contactMax} tone="bg-ink-900" />
            ))}
          </ul>
        </Panel>

        <Panel title={t("losses")}>
          {data.losses.length === 0 ? (
            <Empty text={t("noData")} />
          ) : (
            <ul className="grid gap-4">
              {data.losses.map((row) => (
                <Bar key={row.key} label={lr(row.key)} value={row.value} max={lossMax} tone="bg-danger/70" />
              ))}
            </ul>
          )}
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
                {firstReply.medianHours === null ? (
                  t("noData")
                ) : (
                  <>
                    <bdi>{firstReply.medianHours}</bdi> {t("hours")}
                  </>
                )}
              </b>
            </span>
          </div>
          {firstReply.overLimit !== null ? (
            <div className="flex items-center gap-4 rounded-xl bg-surface-muted p-5">
              <span className="grid size-12 place-items-center rounded-xl bg-danger/10 text-danger">
                <MessageSquareReply className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[14px] text-text-muted">{t("slaOver")}</span>
                <b className="text-[24px]">
                  <bdi>{firstReply.overLimit}</bdi>
                </b>
              </span>
            </div>
          ) : (
            <p className="self-center text-[14px] text-text-muted">{t("slaLimitUnset")}</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
