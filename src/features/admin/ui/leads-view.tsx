"use client";

import { Download, LayoutGrid, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LEAD_STATUSES, canTransition, type LeadStatus } from "@/features/leads";
import { cn } from "@/lib/cn";
import { LOST_REASON_KEYS, type AdminLead } from "../model/admin-lead";
import { formatDateTime } from "./format";
import { StatusBadge, statusDot } from "./status-badge";

type View = "table" | "board";

export function LeadsView({ leads, demo }: { leads: AdminLead[]; demo: boolean }) {
  const t = useTranslations("admin.leads");
  const s = useTranslations("admin.status");
  const src = useTranslations("admin.sources");
  const svc = useTranslations("start.services");

  const router = useRouter();
  const [view, setView] = useState<View>("table");
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const e = useTranslations("admin.errors");
  const lr = useTranslations("admin.lostReasons");

  // Board moves show at once. An override only holds while the server still reports the old status, so when fresh
  // data arrives it takes over by itself.
  const [overrides, setOverrides] = useState<Record<string, { from: LeadStatus; to: LeadStatus }>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<LeadStatus | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(LOST_REASON_KEYS[0]);
  const [boardError, setBoardError] = useState("");

  const live = useMemo(
    () => leads.map((lead) => (overrides[lead.id] && overrides[lead.id]!.from === lead.status ? { ...lead, status: overrides[lead.id]!.to } : lead)),
    [leads, overrides],
  );

  async function move(id: string, to: LeadStatus, why = "") {
    const lead = live.find((l) => l.id === id);
    if (!lead || lead.status === to) return;
    setBoardError("");
    if (!canTransition(lead.status, to)) return setBoardError(e("transition_not_allowed"));
    if (to === "lost" && !why) return setAsking(id);
    const server = leads.find((l) => l.id === id)!;
    setOverrides((o) => ({ ...o, [id]: { from: server.status, to } }));
    try {
      const response = await fetch(`/api/admin/leads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, reason: why }),
      });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setOverrides((o) => {
        const { [id]: _removed, ...rest } = o;
        void _removed;
        return rest;
      });
      setBoardError(e("internal_error"));
    }
  }

  // New leads appear without a manual reload: re-fetch the server data every 30 seconds while the tab is visible.
  useEffect(() => {
    if (demo) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [demo, router]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return live.filter(
      (lead) =>
        (filter === "all" || lead.status === filter) &&
        (q === "" || lead.name.toLowerCase().includes(q) || lead.business.toLowerCase().includes(q)),
    );
  }, [live, filter, query]);

  const counts = useMemo(() => {
    const map = new Map<LeadStatus, number>();
    for (const lead of live) map.set(lead.status, (map.get(lead.status) ?? 0) + 1);
    return map;
  }, [live]);

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
          {demo ? (
            <span className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-[15px] font-semibold opacity-50">
              <Download className="size-4" aria-hidden="true" />
              {t("export")}
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from an API route, not a page
            <a
              href="/api/admin/leads/export"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-[15px] font-semibold hover:border-text-muted/40"
            >
              <Download className="size-4" aria-hidden="true" />
              {t("export")}
            </a>
          )}
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
            const count = key === "all" ? live.length : (counts.get(key) ?? 0);
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
          {boardError ? (
            <p role="alert" className="mb-3 rounded-xl bg-danger/10 p-3 text-[15px] text-danger">
              {boardError}
            </p>
          ) : null}
          {asking ? (
            <div role="dialog" aria-modal="true" aria-label={t("lostTitle")} className="mb-4 grid gap-3 rounded-2xl border border-danger/40 bg-surface p-5">
              <b>{t("lostTitle")}</b>
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-12 rounded-xl border border-surface-line bg-surface ps-4 pe-4 text-base">
                {LOST_REASON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {lr(key)}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const id = asking;
                    setAsking(null);
                    void move(id, "lost", reason);
                  }}
                  className="min-h-11 rounded-xl bg-danger ps-5 pe-5 font-semibold text-surface"
                >
                  {t("lostConfirm")}
                </button>
                <button type="button" onClick={() => setAsking(null)} className="min-h-11 rounded-xl border border-surface-line ps-5 pe-5 font-semibold">
                  {t("lostCancel")}
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {LEAD_STATUSES.map((status) => {
              const column = visible.filter((lead) => lead.status === status);
              return (
                <section
                  key={status}
                  aria-label={s(status)}
                  onDragOver={(event) => {
                    const dragged = live.find((l) => l.id === dragId);
                    if (dragged && !demo && canTransition(dragged.status, status)) {
                      event.preventDefault();
                      setOverColumn(status);
                    }
                  }}
                  onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
                  onDrop={(event) => {
                    event.preventDefault();
                    setOverColumn(null);
                    const id = event.dataTransfer.getData("text/plain") || dragId;
                    setDragId(null);
                    if (id) void move(id, status);
                  }}
                  className={cn(
                    "w-[280px] shrink-0 rounded-2xl border bg-surface-muted/60 p-3 motion-safe:transition-colors",
                    overColumn === status
                      ? "border-brand-strong bg-brand-soft/60"
                      : dragId && canTransition(live.find((l) => l.id === dragId)?.status ?? status, status)
                        ? "border-dashed border-brand-strong/60"
                        : "border-surface-line",
                  )}
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
                        <li
                          key={lead.id}
                          draggable={!demo && LEAD_STATUSES.some((to) => canTransition(lead.status, to))}
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", lead.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDragId(lead.id);
                            setBoardError("");
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverColumn(null);
                          }}
                          className={cn("grid gap-2", dragId === lead.id && "opacity-50")}
                        >
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            draggable={false}
                            className="block cursor-grab rounded-xl border border-surface-line bg-surface p-4 motion-safe:transition hover:-translate-y-0.5 hover:shadow-card active:cursor-grabbing"
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
                          {!demo && LEAD_STATUSES.some((to) => canTransition(lead.status, to)) ? (
                            <select
                              aria-label={t("moveCard", { name: lead.name })}
                              value=""
                              onChange={(event) => {
                                if (event.target.value) void move(lead.id, event.target.value as LeadStatus);
                              }}
                              className="min-h-10 rounded-lg border border-surface-line bg-surface ps-3 pe-3 text-[13px] text-text-muted"
                            >
                              <option value="">{t("moveTo")}</option>
                              {LEAD_STATUSES.filter((to) => canTransition(lead.status, to)).map((to) => (
                                <option key={to} value={to}>
                                  {s(to)}
                                </option>
                              ))}
                            </select>
                          ) : null}
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
