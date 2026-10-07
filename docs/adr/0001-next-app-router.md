# ADR-0001: Next.js App Router and Server Components

## Context

The site is a bilingual marketing surface that must stay fast on mobile and keep business rules off the client.

## Decision

Use Next.js App Router with Server Components by default. Client components are limited to browser state: menu, language path, cookie banner, and the WhatsApp link.

## Consequences

Pages can be static. Firebase writes stay on the server in later steps.
