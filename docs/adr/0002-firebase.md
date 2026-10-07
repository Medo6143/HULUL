# ADR-0002: Firebase for operational data

## Context

The product needs leads, auth claims, files, and background jobs without running a database server for the first release.

## Decision

Use Firestore, Auth, Storage, App Check, and Cloud Functions. The browser never writes. Rules deny all client writes. Admin SDK writes go through use-cases.

## Consequences

A SQL database can replace Firestore later behind the same ports. Government data-residency hosting is a separate deployment, not the default.
