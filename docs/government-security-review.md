# Government-grade Security Review

_Last updated: 18 February 2026_

This document captures the government-grade production security review executed for Decksy AI. It follows the twelve-step engagement plan covering architecture, controls, and verification activities. Severity ratings use the US-CERT scale (Critical, High, Medium, Low, Informational) and all remediation items are tracked in the security backlog.

## 1. Engagement setup & scope confirmation
- Confirmed in-scope assets: Next.js 14 App Router (`src/app`), Prisma/Postgres data layer (`prisma/schema.prisma`), Redis-backed rate limiter (`src/lib/rate-limit.ts`), Gemini explainer integration (`src/lib/gemini.ts`), account lifecycle flows (Auth.js in `src/lib/auth.ts`), filesystem export storage (`src/lib/storage/account-export.ts`).
- Verified environment guardrails in `src/lib/env.ts` enforce schema-backed validation and fall back to sensible defaults for local development while surfacing errors in production builds.

## 2. Architecture & data-flow reconnaissance
- Mapped user flows from unauthenticated quiz submission through `/api/recommend` and `/api/coach` handlers to persistence in Prisma or in-memory stores (`src/app/api/recommend/route.ts`, `src/lib/recommendation-store.ts`).
- Documented background dependencies: Clash Royale proxy fetchers with cache-first reads (`src/lib/clash-royale.ts`), rate-limited feedback ingestion (`src/app/api/feedback/route.ts`), and audit log persistence (`src/lib/audit-log.ts`).
- Identified trust boundaries at browser ↔ API routes, API ↔ data stores, and filesystem exports.

## 3. Threat modeling & abuse-case analysis
- Ran STRIDE analysis on primary endpoints. Key abuse cases include:
  - **Spoofed recommendation sessions** attempting to replay `sessionId` to pull other users' data; mitigated by scoped lookup + validation in `/api/recommend` GET handler.
  - **Feedback spam & scraping** mitigated through layered token bucket enforcement and UA blocklist controls.
  - **LLM prompt injection** constrained by strict JSON schema parsing and fallback explainers.
- Added insider and supply-chain scenarios covering Prisma migrations and npm dependency compromise for inclusion in ongoing tabletop exercises.

## 4. Secure configuration & secrets management
- Reviewed `getServerEnv()` and confirmed zod schema coverage for core secrets, with Heroku alias support and explicit failure logging when validation fails (`src/lib/env.ts`).
- Observed optional handling for `NEXTAUTH_SECRET` where production misconfiguration logs an error but does not halt the process. **Finding GSR-001 (High):** enforce hard failure in production when `NEXTAUTH_SECRET` is absent to prevent unsigned JWT issuance.
- **Finding GSR-002 (Medium):** `REDIS_TLS_ALLOW_SELF_SIGNED` auto-enables insecure TLS when `NODE_ENV=development`; ensure deployment runbooks prohibit setting this flag in production except for break-glass incidents (`src/lib/redis.ts`).
- Secrets inventory reconciled with deployment manifests (NEXTAUTH_SECRET, GEMINI_API_KEY, CLASH_ROYALE_API_KEY, RESEND_API_KEY, DATABASE_URL, REDIS_URL, INTERNAL_API_TOKEN).

## 5. Authentication, authorization & session integrity
- Auth.js configuration uses Prisma adapter, short-lived magic links, GitHub OAuth, and audit hooks (`src/lib/auth.ts`). Session callback propagates `user.id` into JWT, and audit events log create/sign-in/sign-out for traceability.
- Confirmed cookie consent server action persists decisions with `SameSite=Lax` and production-only `secure` flag while recording audit entries (`src/app/actions/cookie-consent.ts`).
- **Finding GSR-003 (Medium):** absence of session revocation endpoint; recommend adding explicit server action to invalidate JWTs after passwordless links are suspected compromised.

## 6. API & business-logic hardening
- `/api/recommend` enforces rate limits, zod validation, and persists payloads via Prisma upsert with fallback to in-memory store. Explainable AI responses are schema-validated before returning (`src/app/api/recommend/route.ts`).
- `/api/coach` ensures deck lookup, optional streaming NDJSON with context gating, and fallback when recommendation context unavailable (`src/app/api/coach/route.ts`).
- `/api/feedback` layers primary + UA token buckets and blocklists suspicious agents before persisting feedback (`src/app/api/feedback/route.ts`).
- Reviewed `src/app/api/player/[tag]/route.ts` and `src/app/api/battles/[tag]/route.ts` for parameter sanitisation - both rely on strict zod schemas before proxying external data.
- **Finding GSR-004 (Low):** Recommendation GET endpoint does not expire in-memory sessions; consider TTL eviction to reduce replay risk if session IDs leak (`src/lib/recommendation-store.ts`).

## 7. Data protection & privacy assessment
- Prisma schema enforces cascading deletes for user-linked data (`prisma/schema.prisma`). Account exports write JSON bundles with checksum metadata but no encryption-at-rest (`src/lib/storage/account-export.ts`).
- **Finding GSR-005 (High):** export bundles stored unencrypted on local filesystem; mandate envelope encryption with rotating keys before long-term storage.
- Verified cookie consent data minimised to analytics toggle only and stored both in cookie + Postgres for compliance evidence.

## 8. Third-party & supply-chain scrutiny
- Key runtime dependencies: Next.js 14.2, Auth.js 4.24, Prisma 6.17, ioredis 5.4, Google Generative AI SDK 0.11 (`package.json`). Lockfile present and should be pinned in CI SCA scans.
- Gemini client enforces strict JSON parsing with fallback content, reducing prompt-injection blast radius (`src/lib/gemini.ts`).
- Recommendation: schedule weekly `npm audit --production` and integrate Snyk/OSV scans into CI.

## 9. Resilience, rate limiting & infrastructure security
- Redis-backed token bucket with Lua script ensures refill semantics; memory fallback maintains functionality when Redis absent and annotates responses with retry headers (`src/lib/rate-limit.ts`).
- Internal bypass keyed by `x-decksy-internal-token`; ensure distribution list restricted and rotated quarterly.
- Deployment resilience reviewed via Procfile release hook for Prisma migrations (see `Procfile`). Recommend chaos testing of Redis outages to confirm graceful degradation.

## 10. Logging, monitoring & auditability
- Audit log helper persists significant auth/privacy events with metadata (`src/lib/audit-log.ts`). Error branches log to stderr without leaking secrets.
- Gaps: application lacks structured security telemetry export (SIEM integration). Add tasks for centralised log shipping and anomaly detection on rate-limit bypass headers.

## 11. Automated & manual testing regimen
- Executed automated suite: `npm run lint` and `npm test` (Vitest) covering schema validation, rate limiter penetration tests, and Gemini prompt parsing.
- Manual review included targeted static analysis of environment validation, API handlers, and Prisma schema migrations.
- Pending: integrate Semgrep ruleset for App Router APIs and secret scanning in CI, plus authenticated DAST harness once staging login scaffolding completes.

## 12. Reporting & remediation support
- Findings summary:

| ID | Severity | Area | Recommendation |
| --- | --- | --- | --- |
| GSR-001 | High | Secrets | Fail fast on missing `NEXTAUTH_SECRET` in production builds and block API start-up until provided. |
| GSR-002 | Medium | Infrastructure | Document and monitor usage of insecure Redis TLS flags; add runtime assertion preventing enablement outside development. |
| GSR-003 | Medium | Sessions | Add server action or API route to revoke JWT sessions and purge magic-link tokens on demand. |
| GSR-004 | Low | Session storage | Attach TTL eviction to in-memory recommendation store entries. |
| GSR-005 | High | Data export | Encrypt account export bundles before writing to disk and rotate keys per deployment. |

- Next steps: file remediation tickets in security backlog, schedule verification scans post-fix, and brief operations on configuration hardening playbook.

## Appendices
- **Artifacts:** architecture notes, threat matrices, and STRIDE worksheets stored in internal security drive.
- **Contacts:** Security lead (Decksy), product engineering manager, and DevOps on-call schedule referenced in `docs/operations.md`.
