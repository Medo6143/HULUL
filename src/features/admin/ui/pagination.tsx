"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export const PAGE_SIZES = [10, 25, 50] as const;

/** Page controls for a client-side list. `page` is 1-based and is clamped by the caller. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const t = useTranslations("admin.pagination");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // A short window of page numbers around the current page, with the first and last always reachable.
  const numbers = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1,
  );

  const button =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-surface-line bg-surface ps-3 pe-3 text-[14px] font-semibold hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label={t("label")} className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[14px] text-text-muted">{t("showing", { from, to, total })}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[14px] text-text-muted">
          {t("perPage")}
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="min-h-10 rounded-lg border border-surface-line bg-surface ps-2 pe-2 text-[14px] text-text"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={button} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t("previous")}>
          <ChevronRight className="size-4 ltr:rotate-180" aria-hidden="true" />
        </button>
        {numbers.map((n, i) => (
          <span key={n} className="flex items-center gap-2">
            {i > 0 && n - numbers[i - 1]! > 1 ? <span aria-hidden="true">...</span> : null}
            <button
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPage(n)}
              className={`${button} ${n === page ? "border-ink-900 bg-ink-900 text-surface hover:border-ink-900" : ""}`}
            >
              {n}
            </button>
          </span>
        ))}
        <button type="button" className={button} disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label={t("next")}>
          <ChevronLeft className="size-4 ltr:rotate-180" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
