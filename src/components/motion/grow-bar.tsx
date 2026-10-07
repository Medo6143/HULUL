"use client";

import { cn } from "@/lib/cn";
import { useReveal } from "./use-reveal";

/** Horizontal bar that fills to `percent` when scrolled into view. */
export function GrowBar({
  percent,
  delay = 0,
  className,
}: {
  percent: number;
  delay?: number;
  className?: string;
}) {
  const [ref, shown] = useReveal<HTMLSpanElement>(0.4);

  return (
    <span ref={ref} className="block h-3 overflow-hidden rounded-full bg-surface-muted">
      <span
        className={cn(
          "block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-1000 motion-safe:ease-out",
          className,
        )}
        style={{ width: shown ? `${percent}%` : "0%", transitionDelay: `${delay}ms` }}
      />
    </span>
  );
}
