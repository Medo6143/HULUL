# ADR-0009: SEO and consent-gated analytics

## Context

Backlog 2.6 (SEO) and 5.1 and 5.2 (analytics) need search metadata, structured data, and tracking that respects PDPL: no pixel or analytics request before the visitor agrees.

## Decision

SEO
- `lib/seo.ts` holds pure helpers (localized URLs, canonical, hreflang with Arabic as x-default, sitemap paths). `lib/page-metadata.ts` adds the env-aware `pageMetadata()` used by every page.
- `sitemap.ts` lists the public pages in both languages. Admin, API, and the legal pages (pending legal review, marked `noindex`) are left out.
- `robots.ts` disallows everything while `NEXT_PUBLIC_SITE_URL` is a placeholder (`example.com` or localhost), so a staging build is never indexed by mistake. With a real domain it allows the site and blocks `/admin` and `/api/`.
- Structured data (Organization, WebSite, FAQPage on the home page, Service on service pages) carries confirmed facts only: name, Riyadh, the three services. No phone, email, rating, or review.

Analytics
- `lib/analytics/ids.ts` decides which providers may load from the consent choice, and validates each id against a strict pattern before it is placed in a third-party script. Analytics consent starts GA4 and Clarity. Marketing consent starts Meta, Snap, and TikTok.
- `AnalyticsProvider` runs only on the public site (the admin has its own root layout). It reads stored consent, reacts to the `hulol:consent` event, and on withdrawal tells the providers to stop and blocks further events.
- Events come only from the typed dictionary (`track()`), and carry no personal data. Elements opt in with data attributes (`data-track`, `data-track-location`, `data-track-view`, `form[data-form]`), so layout components never import analytics code. WhatsApp, `tel:`, and `mailto:` links are recognized by their href.
- The footer's cookie settings button reopens the choices so consent can be changed or withdrawn at any time.

## Not covered yet

- `form_step_complete`, `form_abandon`, and `consultation_booking_*` are in the dictionary but unused: the request form is one page, not steps, and there is no booking flow.
- `generate_lead` leaves out `segment` because the dictionary uses `sme` and the site uses `smes`.
- No Open Graph image yet beyond the 192px logo. A designed 1200x630 image is still needed.
- Lighthouse and Search Console checks need a deployed domain.
- GA4 DebugView verification needs real ids.
