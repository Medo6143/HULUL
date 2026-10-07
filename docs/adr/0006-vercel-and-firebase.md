# ADR-0006: Vercel for the site and Firebase for data

## Context

The stack decision is a hosted Next.js app plus Firebase, with low operational load.

## Decision

Serve the site on Vercel. Keep data and background work in Firebase. Local development uses the Firebase emulators when rules tests start.

## Consequences

Data is outside Saudi Arabia by default. A local-cloud deployment for enterprise or government clients is a later, separate decision.
