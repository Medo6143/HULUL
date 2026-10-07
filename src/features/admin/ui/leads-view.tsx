"use client";

import { Download, LayoutGrid, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LEAD_STATUSES, type LeadStatus } from "@/features/leads";
import { cn } from "@/lib/cn";
import type { DemoLead } from "../demo/demo-leads";
import { formatDateTime } from "./format";
import { StatusBadge, statusDot } from "./status-badge";

type View = "table" | "board";

export function LeadsView({ leads }: { leads: DemoLead[] }) {
  const t = useTranslations("admin.leads");
  const s = useTranslations("admin.status");
  const src = useTranslations("admin.sources");
  const svc = useTranslations("start.services");

  const [view, setView] = useState<View>("table");
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (lead) =>
        (filter === "all" || lead.status === filter) &&
        (q === "" || lead.name.toLowerCase().includes(q) || lead.business.toLowerCase().includes(q)),
    );
  }, [leads, filter, query]);

  const counts = useMemo(() => {
    const map = new Map<LeadStatus, number>();
    for (const lead of leads) map.set(lead.status, (map.get(lead.status) ?? 0) + 1);
    return map;
  }, [leads]);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.3] md:text-[34px]">{t("title")}</h1>
          <p className="mt-1 text-text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t("viewLabel")}
            className="inline-flex rounded-xl border border-surface-line bg-surface p-1"
          >
            {(
              [
                ["table", Table2, t("viewTable")],
                ["board", LayoutGrid, t("viewBoard")],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg ps-3 pe-4 text-[15px] font-semibold motion-safe:transition-colors",
                  view === key ? "bg-ink-900 text-surface" : "text-text-muted hover:text-text",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-[15px] font-semibold hover:border-text-muted/40"
          >
            <Download className="size-4" aria-hidden="true" />
            {t("export")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-surface-line bg-surface p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="min-h-12 w-full rounded-xl border border-surface-line bg-surface-muted ps-12 pe-4 text-base focus-visible:border-brand-strong"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("columns.status")}>
          {(["all", ...LEAD_STATUSES] as const).map((key) => {
            const count = key === "all" ? leads.length : (counts.get(key) ?? 0);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-full border ps-4 pe-3 text-[14px] font-semibold motion-safe:transition-colors",
                  filter === key
                    ? "border-ink-900 bg-ink-900 text-surface"
                    : "border-surface-line bg-surface text-text-muted hover:border-text-muted/40",
                )}
              >
                {key === "all" ? t("all") : s(key)}
                <span
                  className={cn(
                    "grid min-w-6 place-items-center rounded-full ps-1.5 pe-1.5 text-[12px]",
                    filter === key ? "bg-surface/20" : "bg-surface-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[15px] text-text-muted">{t("count", { count: visible.length })}</p>

      {view === "table" ? (
        visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-line bg-surface">
            <table className="w-full min-w-[760px] border-collapse text-start">
              <thead>
                <tr className="border-b border-surface-line bg-surface-muted text-[14px] text-text-muted">
                  {(["name", "service", "source", "status", "created"] as const).map((col) => (
                    <th key={col} scope="col" className="ps-5 pe-5 py-3 text-start font-semibold">
                      {t(`columns.${col}`)}
                    </th>
                  ))}
                  <th scope="col" className="ps-5 pe-5 py-3">
                    <span className="sr-only">{t("open")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-surface-line last:border-0 motion-safe:transition-colors hover:bg-surface-muted/70"
                  >
                    <td className="ps-5 pe-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-ink-900">
                          {lead.name.slice(-1)}
                        </span>
                        <span className="min-w-0">
                          <b className="flex items-center gap-2 text-[16px]">
                            {lead.name}
                            {lead.isNew ? (
                              <span className="rounded-full bg-brand ps-2 pe-2 text-[12px] text-ink-950">
                                {t("newBadge")}
                              </span>
                            ) : null}
                          </b>
                          <span className="block truncate text-[14px] text-text-muted">{lead.business}</span>
                        </span>
                      </div>
                    </td>
                    <td className="ps-5 pe-5 py-4 text-[15px]">{svc(lead.service)}</td>
                    <td className="ps-5 pe-5 py-4 text-[15px]">{src(lead.source)}</td>
                    <td className="ps-5 pe-5 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="ps-5 pe-5 py-4 text-[14px] text-text-muted">{formatDateTime(lead.createdAt)}</td>
                    <td className="ps-5 pe-5 py-4 text-end">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="inline-flex min-h-10 items-center rounded-lg bg-ink-900 ps-4 pe-4 text-[14px] font-semibold text-surface hover:bg-ink-800"
                      >
                        {t("open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="min-w-0">
          <p className="mb-3 text-[14px] text-text-muted">{t("boardHint")}</p>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {LEAD_STATUSES.map((status) => {
              const column = visible.filter((lead) => lead.status === status);
              return (
                <section
                  key={status}
                  aria-label={s(status)}
                  className="w-[280px] shrink-0 rounded-2xl border border-surface-line bg-surface-muted/60 p-3"
                >
                  <h2 className="mb-3 flex items-center gap-2 ps-1 text-[15px] font-bold">
                    <span aria-hidden="true" className={cn("size-2.5 rounded-full", statusDot[status])} />
                    {s(status)}
                    <span className="ms-auto rounded-full bg-surface ps-2 pe-2 text-[13px] text-text-muted">
                      {column.length}
                    </span>
                  </h2>
                  <ul className="grid gap-3">
                    {column.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-surface-line p-4 text-center text-[14px] text-text-muted">
                        {t("emptyColumn")}
                      </li>
                    ) : (
                      column.map((lead) => (
                        <li key={lead.id}>
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="block rounded-xl border border-surface-line bg-surface p-4 motion-safe:transition hover:-translate-y-0.5 hover:shadow-card"
                          >
                            <span className="flex items-center justify-between gap-2">
                              <b className="text-[15px]">{lead.name}</b>
                              {lead.isNew ? (
                                <span className="rounded-full bg-brand ps-2 pe-2 text-[12px] text-ink-950">
                                  {t("newBadge")}
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1 block truncate text-[14px] text-text-muted">{lead.business}</span>
                            <span className="mt-3 flex items-center justify-between text-[13px] text-text-muted">
                              <span>{svc(lead.service)}</span>
                              <span>{formatDateTime(lead.createdAt)}</span>
                            </span>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
