import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-surface-line bg-surface-muted text-text",
  success: "border-success bg-surface text-text",
  warning: "border-warning bg-surface text-text",
  danger: "border-danger bg-surface text-text",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border ps-3 pe-3 text-[15px] font-semibold leading-[1.6]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
