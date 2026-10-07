"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll reveal that fails safe: content is visible on the server and without JavaScript.
 * Only elements that start below the fold are hidden, then shown when they scroll into view.
 * Reduced-motion visitors never get anything hidden.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    // Hiding after hydration is intentional: it avoids a server/client mismatch and a flash on first paint.
    setShown(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, shown] as const;
}
