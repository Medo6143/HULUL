# Missing content

These items are not published. Do not invent them. The blocks stay empty until you send the real values.

## Not supplied yet

- Commercial registration number
- VAT number
- National address
- Domain (the app currently uses https://example.com as a placeholder)
- Official WhatsApp number (E.164). The old test number is not used. The floating button stays hidden until this is set in NEXT_PUBLIC_WHATSAPP_NUMBER.
- Official email and team alert email
- Social accounts
- Three real case studies with permission, measurable results, and screenshots. The work page has a heading only.
- Testimonials with written consent. The old-site quote from Eng. Sultan Al-Shammari / The Grid is not published.
- Team photos and company story beyond the confirmed scope (web, mobile, design, Riyadh)
- SLA commitments still blank in the content checklist: first reply, consultation scheduling, written proposal timing, weekly report, warranty length, critical response time, and business hours. The one-hour reply line from the sample copy is not shown.
- Budget-range buckets for the optional form question
- Legal review of privacy, terms, cookies, and e-signature wording. Those pages say the text is waiting for review.
- Nitaqat, Etimad, and partnership certificates
- Firebase project ids, App Check, Resend, GA4, Clarity, and ad pixel ids

## Pages built with placeholders by design

- Home, about, and request pages use illustrated Saudi characters instead of photos. Real team or project photos are still needed.
- The work and testimonials sections are hidden (home) or show an empty state (work page) until `src/config/case-studies.ts` and `src/config/testimonials.ts` are filled.
- Segment pages (`/for/*`) use only the promise from the master plan. Client examples per segment and the enterprise compliance profile are still missing.
- Service bullets (for example local payment gateways, store publishing) come from the design preview file and need the team's confirmation.

- Market figures on the home page (`src/config/market-data.ts`) are copied from the master plan with their sources. Re-check them against DataReportal and Qoyod before launch.

## Logo color check

The file `public/icons/nav-logo.png` is the original 500x500 PNG from https://hulol-tech.vercel.app/icons/nav-logo.png (SHA-256 `B144463B17BC54AEDBDCB3BA994CAAF0788BCE781B15B20882734611955505E1`). It was not redrawn.

Sampled from opaque pixels:

- Mark cyan average about `#04E4F9`. Design-system `brand` is `#00D2FF`. Exact `#00D2FF` pixel count: 0.
- Wordmark navy average about `#031239`. Design-system `ink-950` is `#050B14`. Exact `#050B14` pixel count: 0.
- The file background is transparent, not `#050B14`.

Tokens stay on the design-system values copied from `tailwind.preset.ts`. No new brand colors were chosen.

## Withheld on purpose in this step

- Public prices
- The first-reply promise "خلال ساعة عمل"
- Proposal timing "خلال 3 أيام عمل" and other unconfirmed SLA durations
