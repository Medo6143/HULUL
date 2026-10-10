"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { dispatchPageView, revokeProviders, startProvider } from "@/lib/analytics/browser";
import { providersToLoad, sanitizeId, type ProviderIds } from "@/lib/analytics/ids";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  parseConsent,
  type ConsentState,
} from "@/lib/consent";
import type { Locale } from "../domain/analytics-events";
import { track } from "./track";

const locationOf = (el: Element): string =>
  el.closest("[data-track-location]")?.getAttribute("data-track-location") ?? "unknown";

/**
 * Loads providers only after consent and turns marked DOM elements into dictionary events.
 * Elements opt in with data attributes, so components never import analytics code:
 *   data-track="cta_click" | "language_toggle", data-track-location="hero",
 *   data-track-view="cost_section_view", form[data-form="project"].
 * WhatsApp, phone, and email links are recognized by their href.
 */
export function AnalyticsProvider({ ids }: { ids: ProviderIds }) {
  const locale: Locale = useLocale() === "en" ? "en" : "ar";
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const loadedAny = useRef(false);

  // Consent decides which providers start; withdrawing it stops sending.
  useEffect(() => {
    const apply = (consent: Pick<ConsentState, "analytics" | "marketing"> | null) => {
      const list = providersToLoad(consent, ids);
      for (const { key, id } of list) startProvider(key, id, { marketing: consent?.marketing ?? false });
      if (list.length > 0) loadedAny.current = true;
      if (loadedAny.current && (!consent || (!consent.analytics && !consent.marketing))) {
        revokeProviders({ ga4: sanitizeId("ga4", ids.ga4), clarity: sanitizeId("clarity", ids.clarity) });
      }
    };
    apply(parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY)));
    const onChange = (event: Event) => apply((event as CustomEvent<ConsentState>).detail);
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, [ids]);

  // Client-side navigations do not reload the providers, so report each page view.
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    dispatchPageView(pathname);
  }, [pathname]);

  // Click delegation: CTA, language, WhatsApp, phone, email.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const el = target?.closest("a, button");
      if (!el) return;
      const href = el instanceof HTMLAnchorElement ? el.href : "";
      const location = locationOf(el);

      if (href.startsWith("tel:")) track({ name: "phone_click", params: { location } });
      else if (href.startsWith("mailto:")) track({ name: "email_click", params: { location } });
      else if (/^https:\/\/wa\.me\//.test(href)) {
        track({ name: "whatsapp_click", params: { location, page: pathRef.current, locale } });
      }

      const kind = el.getAttribute("data-track");
      if (kind === "cta_click") {
        const label = (el.textContent ?? "").trim().slice(0, 60);
        track({ name: "cta_click", params: { location, label, locale } });
      } else if (kind === "language_toggle") {
        const from = el.getAttribute("data-from") === "en" ? "en" : "ar";
        const to = el.getAttribute("data-to") === "en" ? "en" : "ar";
        track({ name: "language_toggle", params: { from, to } });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [locale]);

  // form_start: the first time a visitor focuses any field of a marked form.
  useEffect(() => {
    const started = new WeakSet<Element>();
    const onFocus = (event: FocusEvent) => {
      const form = (event.target as Element | null)?.closest("form[data-form]");
      if (!form || started.has(form)) return;
      started.add(form);
      const kind = form.getAttribute("data-form") === "consultation" ? "consultation" : "project";
      track({ name: "form_start", params: { form: kind } });
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  // scroll_75 and section views, once per page.
  useEffect(() => {
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0 && window.scrollY / total >= 0.75) {
        fired = true;
        track({ name: "scroll_75", params: { page: pathname } });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (entry.target.getAttribute("data-track-view") === "cost_section_view") {
            track({ name: "cost_section_view", params: { page: pathname } });
          }
        }
      },
      { threshold: 0.4 },
    );
    document.querySelectorAll("[data-track-view]").forEach((node) => observer.observe(node));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
