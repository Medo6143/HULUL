# ADR-0010: Staff auth, notifications, and hardening

## Context

Epics 3.6, 4, and the security rules in the engineering principles needed decisions that differ in places from the original plan.

## Decisions

**Staff authentication**
- Staff sign in at `/admin/login`. The server checks the password through the Firebase Auth REST API, checks the custom claim `role` (`owner` or `agent`), and sets an httpOnly, SameSite=Lax session cookie created by the Admin SDK. No Firebase client SDK ships to the browser.
- `src/proxy.ts` only checks that a session cookie exists. Every admin page and API call verifies the cookie (signature, revocation, role) again on the server. Mutating admin APIs also require a same-origin `Origin`.
- Roles are granted with `scripts/set-admin-claim.mjs`. Without a valid role there is no access.
- `ADMIN_DEMO=1` shows sample data only outside production.

**Admin data**
- The dashboard reads leads through the existing ports and use-cases. Stage counts on the analytics page come from each lead's current status, so they are close approximations and not an event log; the screen says so. `firstResponseAt` is stored when a lead first leaves `new`.
- New leads appear by refreshing the server data every 30 seconds while the tab is visible, instead of a Firestore realtime listener, which would need the Firebase client SDK in the browser.
- A first-reply limit is not confirmed, so `src/config/sla.ts` holds `null` and the "past the limit" card stays hidden.

**Notifications** (plan item 3.6)
- Sent in process, right after the lead or message is saved, through a `Notifier`-style service (email through Resend, optional Telegram), not through a Cloud Function. This avoids a second deployable and works on Vercel. Failures never fail the request and every attempt is written to `notificationLogs`.
- Not done: automatic retry, and the SLA reminder timer. A Cloud Function or a scheduled job would be needed for those.
- Emails never promise a reply time.

**Spam and abuse**
- reCAPTCHA v3 checked on the server replaces Firebase App Check (same purpose, no client SDK). It is skipped when no secret is set.
- Rate limits are counters in Firestore (`rateLimits`), shared by all instances, with an in-memory fallback if Firestore is unreachable.
- A Content Security Policy and the standard security headers are set in `next.config.ts`. `script-src` keeps `'unsafe-inline'` because Next.js injects inline scripts; everything else is restricted to known hosts.

**Testing**
- Playwright specs cover the request journey, consent, security headers, and axe checks in both languages. Firestore rules have emulator tests (`npm run test:rules`). Lighthouse CI and a secret scan run in CI.

## Consequences

Anything on the "not done" list above is future work. Contact form messages are stored in `contactMessages` and emailed to the team, but there is no admin screen for them yet.
