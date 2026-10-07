"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` once visible. Renders the final value on the server and for reduced motion. */
export function CountUp({
  to,
  decimals = 0,
  duration = 1400,
}: {
  to: number;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setValue(0);
    let frame = 0;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(to * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        // Animation frames pause in background tabs; make sure the final number always lands.
        fallback = setTimeout(() => setValue(to), duration + 300);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
    };
  }, [to, duration]);

  return (
    <span ref={ref} dir="ltr" className="tabular-nums">
      {value.toFixed(decimals)}
    </span>
  );
}
