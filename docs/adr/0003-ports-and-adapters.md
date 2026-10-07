# ADR-0003: Ports, adapters, and one composition root

## Context

Lead rules must be testable without Next.js or Firebase, and Firebase must be replaceable.

## Decision

Domain and application code depend inward only. Adapters live in infrastructure. `src/lib/container.ts` is the only composition root. `eslint-plugin-boundaries` fails the build on a violation.

## Consequences

Use-cases return `Result`. Expected failures are not thrown.
