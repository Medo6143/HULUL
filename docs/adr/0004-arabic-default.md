# ADR-0004: Arabic is the default locale

## Context

The audience is Saudi and Gulf clients. Arabic is the reference copy. English is the translation.

## Decision

`next-intl` with `localePrefix: "always"`, default locale `ar`, and `dir` set from the locale. IBM Plex Sans Arabic for Arabic pages and Inter for English pages. Layout uses logical CSS only.

## Consequences

`/` redirects to `/ar`. Message keys must match across `ar.json` and `en.json`.
