# Security & Threat Model

_Last updated: 27 March 2025_

## Mission-critical assets

- **Player identity data** — authenticated user profiles, linked OAuth accounts, and Clash Royale player tags.
- **Recommendation history** — personalised deck suggestions, AI explainers, and feedback notes.
- **Operational infrastructure** — Prisma/Postgres, Redis token buckets, Gemini API credentials, and exported account bundles.
- **Session integrity** — Auth.js sessions, magic-link flows, and consent cookies that gate optional analytics.

## Trust boundaries & threat agents

| Boundary | Trusted parties | Potential adversaries |
| --- | --- | --- |
| Browser ↔️ App Router APIs (`/api/*`) | Authenticated Decksy users, anonymous visitors solving quizzes | Scripted clients hammering recommendation endpoints, replaying session IDs |
| App Router ↔️ Postgres/Redis | Server components, server actions | Compromised deployment, insider threat |
| Storage for exports | Decksy staff with SSH access, automated workers | Attackers exfiltrating exported JSON bundles |

Primary attacker motivations: credential stuffing (re-use of OAuth emails), scraping recommendation catalogues, and exhausting rate limits to degrade service.

## Key mitigations

- **Authentication & authorisation** — Auth.js + Prisma adapter, OAuth account linking, audit logging for profile/session changes.
- **Rate limiting** — Token bucket on all `/api/*` routes via `enforceRateLimit`, falling back to in-memory limiter when Redis is unavailable.
- **Data minimisation** — Decksy only persists recommendation payloads tied to sessions or opted-in accounts; exports produce signed JSON bundles stored outside of the request path.
- **Consent management** — Cookie consent banner defers analytics until the user opts in and stores the decision in both cookies and Postgres.
- **Account lifecycle** — New server actions export JSON bundles to filesystem storage and transactional account deletion clears linked recommendations, feedback, sessions, and consent metadata.

## Rate-limit penetration test results

Methodology:

1. Exercised the in-memory token bucket by issuing sequential requests against a unique resource key using `enforceRateLimit`.
2. Verified lockout behaviour (HTTP 429 equivalent) triggers after exceeding the configured limit.
3. Confirmed retry metadata surfaces via `RateLimitState` to power headers like `Retry-After`.

The automated test harness lives in `src/lib/__tests__/rate-limit-penetration.test.ts` and runs with `npm test`. Latest run: **pass** — the limiter blocks the fourth burst request and reports `retryAfterMs` > 0, demonstrating protection against short-lived floods.

## Residual risks & follow-up tickets

| Ticket | Summary | Notes |
| --- | --- | --- |
| `SEC-2025-001` | Harden cookie consent sync for unauthenticated visitors | Persist a hashed consent identifier so repeats across devices do not resurface the banner unnecessarily. |
| `SEC-2025-002` | Ship long-lived Redis-backed rate limiting | Memory fallback resets on process restart; capture a migration plan for production Redis enforcement. |
| `SEC-2025-003` | Encrypt at-rest account export bundles | Current filesystem storage lives on the app host; introduce envelope encryption before copying to long-term storage.

All tickets are logged in the internal security backlog referenced in `docs/operations.md`.
