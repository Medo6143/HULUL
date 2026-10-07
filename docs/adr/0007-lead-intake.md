# ADR-0007: Lead intake through one API route and one page-level form

## Context

Backlog Epic 3 needs a public form that creates leads safely. The engineering principles require Zod at the boundary, honeypot, rate limit, App Check, server-only writes, and a unified error shape with i18n message keys.

## Decision

- `POST /api/leads` is thin: size check, JSON parse, rate limit, Zod parse, honeypot, then the `CreateLead` use-case through `lib/container.ts`.
- The domain owns the invariants: valid phone, valid name and email, consent required, allowed status transitions, reason required to lose a lead. The domain keeps its own `Result` type because it may not import from `lib`.
- Responses are `{ ok: true }` or `{ ok: false, error: { code, message_key } }`. `message_key` points at `errors.lead.*` in both locale files.
- The UI is a single form (`LeadForm`), not a wizard: the plan itself says fewer visible fields matter more than fewer steps. The consent checkbox always starts unchecked. The same form serves `/start` (type `project`), `/consultation` (type `consultation`), and the home consult section.
- Notifications are not part of `CreateLead`. They belong to the Cloud Function on `leads/{id}` creation (backlog 3.6), so the use-case has no `Notifier` port yet.

## Known gaps

- App Check is not verified yet. It needs the reCAPTCHA keys.
- The rate limiter is in process memory. It does not hold across serverless instances and needs a shared store before launch.
- The Firestore adapter has no test run against the emulator yet. The repository contract suite currently runs on the in-memory adapter only.
- The success message does not promise a reply time or an email confirmation, because the SLA values and the email channel are not confirmed (see `MISSING_CONTENT.md`).

## Consequences

Adding a channel or a field changes the schema, the domain factory, and the form, and nothing else.
