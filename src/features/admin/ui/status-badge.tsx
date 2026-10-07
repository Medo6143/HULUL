import { useTranslations } from "next-intl";
import type { LeadStatus } from "@/features/leads";
import { cn } from "@/lib/cn";

const tones: Record<LeadStatus, string> = {
  new: "bg-brand-soft text-ink-900",
  contacted: "bg-ink-900/10 text-ink-900",
  consultation: "bg-brand/25 text-ink-900",
  proposal: "bg-warning/15 text-warning",
  negotiation: "bg-warning/25 text-warning",
  won: "bg-success/15 text-success",
  lost: "bg-danger/10 text-danger",
  parked: "bg-surface-muted text-text-muted",
};

export const statusDot: Record<LeadStatus, string> = {
  new: "bg-brand",
  contacted: "bg-ink-700",
  consultation: "bg-brand-strong",
  proposal: "bg-warning",
  negotiation: "bg-warning",
  won: "bg-success",
  lost: "bg-danger",
  parked: "bg-text-muted",
};

/** Color plus text label, never color alone. */
export function StatusBadge({ status }: { status: LeadStatus }) {
  const t = useTranslations("admin.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1 ps-3 pe-3 text-[14px] font-semibold",
        tones[status],
      )}
    >
      <span aria-hidden="true" className={cn("size-2 rounded-full", statusDot[status])} />
      {t(status)}
    </span>
  );
}
