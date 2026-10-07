"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReveal } from "./use-reveal";

/** Fade and rise on scroll. `delay` (ms) staggers siblings. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const [ref, shown] = useReveal<HTMLElement>();
  const style: CSSProperties = { transitionDelay: shown ? `${delay}ms` : "0ms" };

  return (
    <Tag
      ref={ref}
      style={style}
      className={cn(
        "motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
