"use client";

import type { ProviderKey } from "./ids";

// Browser adapters for the tracking providers. Nothing here runs before the visitor consents:
// the caller decides which providers to start. No personal data is ever sent, only event names and
// the small params defined in the analytics dictionary.

type Fn = (...args: unknown[]) => void;
type Params = Record<string, string | number | boolean | undefined>;

const w = () => window as unknown as Record<string, unknown>;
const started = new Set<ProviderKey>();
let blocked = false;

function injectScript(src: string): void {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function startGa4(id: string, ads: boolean): void {
  const win = w();
  const dataLayer = (win.dataLayer as unknown[]) ?? (win.dataLayer = []);
  const gtag: Fn = function () {
    // gtag requires the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  win.gtag = gtag;
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("config", id);
  gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: ads ? "granted" : "denied",
    ad_user_data: ads ? "granted" : "denied",
    ad_personalization: ads ? "granted" : "denied",
  });
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

function startClarity(id: string): void {
  const win = w();
  const clarity: Fn & { q?: unknown[] } = function (...args: unknown[]) {
    (clarity.q = clarity.q ?? []).push(args);
  };
  win.clarity = (win.clarity as Fn | undefined) ?? clarity;
  injectScript(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`);
}

function startMeta(id: string): void {
  const win = w();
  if (win.fbq) return;
  const fbq: Fn & { queue?: unknown[]; callMethod?: Fn; loaded?: boolean; version?: string } =
    function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else (fbq.queue as unknown[]).push(args);
    };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  win.fbq = fbq;
  win._fbq = fbq;
  injectScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", id);
  fbq("track", "PageView");
}

function startSnap(id: string): void {
  const win = w();
  if (win.snaptr) return;
  const snaptr: Fn & { queue?: unknown[]; handleRequest?: Fn } = function (...args: unknown[]) {
    if (snaptr.handleRequest) snaptr.handleRequest(...args);
    else (snaptr.queue as unknown[]).push(args);
  };
  snaptr.queue = [];
  win.snaptr = snaptr;
  injectScript("https://sc-static.net/scevent.min.js");
  snaptr("init", id, {});
  snaptr("track", "PAGE_VIEW");
}

function startTikTok(id: string): void {
  const win = w();
  if (win.ttq) return;
  const queue: unknown[][] & Record<string, unknown> = [] as never;
  const methods = ["page", "track", "identify", "ready", "enableCookie", "disableCookie"];
  for (const method of methods) {
    queue[method] = (...args: unknown[]) => {
      queue.push([method, ...args]);
    };
  }
  win.ttq = queue;
  win.TiktokAnalyticsObject = "ttq";
  injectScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=ttq`);
  (queue.page as Fn)();
}

/** Starts a provider once. Safe to call repeatedly. */
export function startProvider(key: ProviderKey, id: string, opts: { marketing: boolean }): void {
  if (started.has(key)) return;
  started.add(key);
  blocked = false;
  if (key === "ga4") startGa4(id, opts.marketing);
  if (key === "clarity") startClarity(id);
  if (key === "meta") startMeta(id);
  if (key === "snap") startSnap(id);
  if (key === "tiktok") startTikTok(id);
}

/** Visitor withdrew consent: stop sending. Already-loaded scripts cannot be unloaded, so the page is told to ignore them. */
export function revokeProviders(ids: { ga4: string | null; clarity: string | null }): void {
  blocked = true;
  const win = w();
  if (ids.ga4) win[`ga-disable-${ids.ga4}`] = true;
  if (typeof win.gtag === "function") {
    (win.gtag as Fn)("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
  if (ids.clarity && typeof win.clarity === "function") (win.clarity as Fn)("consent", false);
}

function call(name: string, ...args: unknown[]): void {
  const fn = w()[name];
  if (typeof fn === "function") (fn as Fn)(...args);
}

/** Sends a dictionary event. GA4 gets everything; the pixels only get conversions. */
export function dispatchEvent(name: string, params: Params = {}): void {
  if (blocked) return;
  if (started.has("ga4")) call("gtag", "event", name, params);
  if (name === "generate_lead") {
    if (started.has("meta")) call("fbq", "track", "Lead");
    if (started.has("snap")) call("snaptr", "track", "SIGN_UP");
    if (started.has("tiktok")) (w().ttq as { track?: Fn } | undefined)?.track?.("SubmitForm");
  }
}

/** Single-page navigations do not reload the providers, so each one reports its own page view. */
export function dispatchPageView(path: string): void {
  if (blocked) return;
  if (started.has("ga4")) call("gtag", "event", "page_view", { page_path: path });
  if (started.has("meta")) call("fbq", "track", "PageView");
  if (started.has("snap")) call("snaptr", "track", "PAGE_VIEW");
  if (started.has("tiktok")) (w().ttq as { page?: Fn } | undefined)?.page?.();
}
