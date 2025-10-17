# Decksy AI — Master Roadmap (Next 12 Months)

Purpose: This is the living roadmap for Decksy AI. It captures product direction, quarterly themes, prioritized epics, and Jira-style tasks with acceptance criteria. Update this file as plans evolve and when work ships.

Last updated: 2025-10-17


## Current State Snapshot

* App: Next.js 14 (App Router), TypeScript (strict), Tailwind UI. Design system in place; dark theme only.
* Data & Integrations:
  * Clash Royale API integration with resilient fallbacks and Redis/in-memory caching (`src/lib/clash-royale.ts`, `src/lib/redis.ts`).
  * Deterministic rules-based scoring engine v1 (`src/lib/scoring.ts`).
  * Gemini explainers with JSON schema parsing, model fallback chain, and caching (`src/lib/gemini.ts`).
* Auth & Accounts: Auth.js with magic links + GitHub OAuth; Prisma adapter; account + profile edit and session revocation UIs (`/account`).
* Persistence: Prisma schema for users, profiles, recommendations, explainers, feedback, audit logs; runtime disables Prisma if `DATABASE_URL` is missing (`src/lib/prisma.ts`).
* Product Surfaces:
  * Onboarding flow to fetch player and battles, short quiz, and recommendations (`PlayerOnboarding`).
  * Recommendations UI with top-3 decks, breakdown, notes, and explainers.
  * Deck guide page with coach notes.
  * History list backed by DB or ephemeral store.
* Docs & Conventions: `.github/copilot-instructions.md`, `AGENTS.md`, strict TypeScript, `@/*` imports, CVA variants, `cn()` helper.

Known gaps and opportunities:
* Rate limiting, input validation on all routes, and abuse protections are partial.
* Analytics/monitoring are planned but not wired (PostHog, Sentry).
* Deck catalog is small and hand-authored; art sourcing is inconsistent.
* No scheduled refresh of player data; limited personalization loop from feedback.
* A11y and i18n audits pending; performance budgets untracked.
* CI/CD hardening and automated QA incomplete; no feature flagging.


## Product North Star

Help Clash Royale players climb faster with decks that fit their collection and playstyle—and coach them with concise, actionable insights. Focus areas:
* Trustworthy suggestions grounded in player data and explicit preferences.
* Fast, polished, and accessible UX.
* Clear coaching that improves player skill over time.
* Privacy-first analytics to inform iteration.


## Quarterly Themes (12-Month View)

Q4 2025 — Foundations and Insights
* Ship analytics/monitoring, expand deck catalog, add route validation and rate limiting, and improve coach reliability.

Q1 2026 — Personalization and Retention
* Feedback-driven tuning of scoring, scheduled profile refresh, onboarding polish, and coach v2 (practice plans, streaming UI).

Q2 2026 — Scale and Performance
* Feature flags/experimentation, caching and edge strategy, a11y/i18n improvements, and deeper testing (e2e + integration).

Q3 2026 — Depth and Discovery
* Advanced matchup intelligence, deck discovery filters, social sharing, and optional premium features exploration.


## Epics and Jira-Style Tasks

Format:
* [Epic] Title
  * TASK-ID: Summary — Description
    * Acceptance
    * Dependencies
    * Estimate
    * Owner/Team


### [Epic] Analytics & Monitoring

* ANA-1: Integrate PostHog client + server events
  * Add minimal PostHog capture for: recommendation generated, deck view, feedback submitted; respect Do Not Track and a cookie-less mode.
  * Acceptance: Events visible in PostHog; env-gated via `NEXT_PUBLIC_POSTHOG_KEY` with graceful no-op when unset.
  * Dependencies: Env wiring, cookie consent copy.
  * Estimate: 2d
  * Owner: Web

* ANA-2: Wire Sentry for server and edge handlers
  * Capture unhandled route errors, Gemini call failures, and Redis connectivity issues; attach request context and session (anonymous ID).
  * Acceptance: Errors appear in Sentry with route path and tags for model id; disabled without `SENTRY_DSN`.
  * Dependencies: Env schema (`src/lib/env.ts`), Next instrumentation.
  * Estimate: 2d
  * Owner: Platform

* ANA-3: Metrics dashboard doc
  * Document top 10 metrics (conversion to recommendation, time-to-first-results, feedback rate, error rate, P95 latency) and how to query them.
  * Acceptance: `docs/metrics.md` with saved PostHog/Sentry views linked.
  * Estimate: 1d
  * Owner: PM+Data


### [Epic] API Hardening: Validation, Rate Limiting, Abuse Protection

* API-1: Zod request schemas for all routes
  * Add input validation and typed responses for `/api/recommend`, `/api/coach`, `/api/feedback`, `/api/player/[tag]`, `/api/battles/[tag]`.
  * Acceptance: Invalid inputs return 400 with consistent JSON error shape; Vitest unit tests for schema.
  * Dependencies: zod (already present).
  * Estimate: 3d
  * Owner: Backend

* API-2: IP and per-session rate limits
  * Implement rate limiting middleware with Redis token bucket; public GET routes limited to sane defaults (e.g., 60/min per IP).
  * Acceptance: 429 with Retry-After; bypass for server-to-server; tested.
  * Dependencies: Redis.
  * Estimate: 3d
  * Owner: Platform

* API-3: Abuse and spam controls
  * Add honeypot fields to feedback form and simple UA throttles; blocklist env override.
  * Acceptance: Reduced junk requests in logs; documented switches.
  * Estimate: 2d
  * Owner: Backend


### [Epic] Deck Catalog Expansion & Art Pipeline

* CAT-1: Expand catalog to 30–50 curated decks
  * Create data seeds for popular archetypes with trophy bands; add strengths/weaknesses consistency.
  * Acceptance: `deck-catalog.ts` or DB-backed table updated; build passes; recommendation diversity improved.
  * Dependencies: Optional migration if moving to DB.
  * Estimate: 4d
  * Owner: Content

* CAT-2: Card art sourcing and fallbacks
  * Standardize CDN paths and error handling; local fallback thumbnails for all cards; remove broken links.
  * Acceptance: 0 broken images in lighthouse; `public/cards/*` complete; per-key override map in one place.
  * Dependencies: Assets.
  * Estimate: 3d
  * Owner: Web

* CAT-3: Catalog admin script(s)
  * Add scripts to lint catalog data, validate keys, and compute derived props (avg elixir).
  * Acceptance: `npm run catalog:lint` and CI check.
  * Dependencies: Node script.
  * Estimate: 2d
  * Owner: Platform


### [Epic] Coach v2 (Gemini) — Reliability and Utility

* COACH-1: Streaming and progressive UI
  * Stream Gemini summaries to the UI with loading states; keep JSON schema integrity.
  * Acceptance: Deck page shows progressive content; abort signal supported.
  * Dependencies: Route updates, client components.
  * Estimate: 4d
  * Owner: Web

* COACH-2: Personalised practice plan output
  * Extend schema to include 3-session practice plan tailored to weaknesses and trophy goals.
  * Acceptance: New optional field `practicePlan[]` returned and rendered; guarded behind feature flag.
  * Dependencies: Feature flags.
  * Estimate: 3d
  * Owner: Backend

* COACH-3: Cache invalidation on deck/player drift
  * Invalidate explainer cache when trophy band or collection readiness changes materially.
  * Acceptance: Cache key includes coarse player signature; unit tests.
  * Estimate: 2d
  * Owner: Backend


### [Epic] Recommendation Engine v2 (Personalization)

* REC-1: Incorporate recent battle outcomes & matchup exposure
  * Adjust scoring weights based on opponent archetypes in last N matches.
  * Acceptance: `scoreDeck` considers exposure signal; tests show deterministic adjustments.
  * Dependencies: battle log parser improvements.
  * Estimate: 4d
  * Owner: Data/Backend

* REC-2: Feedback loop tuning
  * When users like/dislike a recommendation, adjust future deck ranking slightly; keep deterministic and auditable.
  * Acceptance: Preference persisted and applied; A/B option via feature flags.
  * Dependencies: Auth, DB.
  * Estimate: 3d
  * Owner: Backend

* REC-3: Weight A/B experiments
  * Roll out alternative weights and compare engagement/feedback over time.
  * Acceptance: Experiment assignment recorded; analysis notebook or doc.
  * Dependencies: Feature flags, analytics.
  * Estimate: 3d
  * Owner: Data


### [Epic] Player Data Refresh & Profile Enrichment

* PDR-1: Scheduled refresh job
  * Add scheduled job (Heroku Scheduler / GitHub Action / Vercel cron) to refresh player profile for signed-in users daily.
  * Acceptance: Job logs, rate-respectful, backs off on API failures.
  * Dependencies: Platform choice.
  * Estimate: 3d
  * Owner: Platform

* PDR-2: Profile sync banner & consent
  * UI to opt into auto-refresh; show last sync time on `/account`.
  * Acceptance: Consent stored; banners reflect status; accessible.
  * Dependencies: DB fields.
  * Estimate: 2d
  * Owner: Web

* PDR-3: Battle log summarisation
  * Derive simple telemetry (W/L/D, archetype exposure) and store aggregates for personalization.
  * Acceptance: Aggregates visible in account; used by REC-1.
  * Dependencies: DB tables.
  * Estimate: 3d
  * Owner: Backend


### [Epic] Onboarding & UX Polish

* UX-1: Improved tag entry and validation
  * Autoclean, check digit/length, and show copy about where to find tag; keyboard and mobile focus states.
  * Acceptance: Error states covered; a11y labels; tests.
  * Estimate: 2d
  * Owner: Web

* UX-2: Skeletons and empty states
  * Add skeleton UIs for loading player, battles, and recommendations; friendly empty-state copy.
  * Acceptance: No layout shift spikes; ship in main flows.
  * Estimate: 2d
  * Owner: Web

* UX-3: History detail view
  * Click into a past recommendation and see the exact breakdown and explainer captured at the time.
  * Acceptance: `/history/[sessionId]` page; uses persisted payload.
  * Dependencies: DB completeness.
  * Estimate: 3d
  * Owner: Web


### [Epic] Accessibility (a11y) & Internationalization (i18n)

* A11Y-1: Audit and fixes (WCAG AA)
  * Audit headings, color contrast, focus order, keyboard support, ARIA roles.
  * Acceptance: Lighthouse a11y ≥ 95; axe clean on core pages.
  * Estimate: 3d
  * Owner: Web

* I18N-1: Localization scaffolding
  * Set up simple i18n (e.g., next-intl) for copy; externalize strings for easy future translations.
  * Acceptance: English extracted; switchable locale skeleton.
  * Estimate: 3d
  * Owner: Web


### [Epic] Platform & Performance

* PERF-1: Edge caching strategy
  * Cache safe GETs at the edge (deck guides, coach reads); validate TTL/ISR with Next.
  * Acceptance: P95 TTFB improved; headers present; no stale personalized data leaks.
  * Estimate: 3d
  * Owner: Platform

* PERF-2: Redis resilience and metrics
  * Add health checks, auto-retry, and circuit breaker for cache misses; export basic metrics to logs.
  * Acceptance: Clear logs; degraded-mode warnings only.
  * Estimate: 2d
  * Owner: Backend

* PERF-3: Image optimization pass
  * Standardize Next/Image usage, sizes, and placeholders; evaluate self-hosted sprites for cards.
  * Acceptance: Lighthouse perf +5 on mobile; no CLS regressions.
  * Estimate: 3d
  * Owner: Web


### [Epic] CI/CD, QA, and Developer Experience

* CI-1: GitHub Actions pipeline
  * Lint, typecheck, test, and preview build; cache pnpm/npm; annotate PRs.
  * Acceptance: Status checks required on `main`.
  * Estimate: 2d
  * Owner: Platform

* CI-2: Dependabot + security scanning
  * Enable dependency updates and `npm audit` CI job with allowlist for known safe advisories.
  * Acceptance: Weekly PRs; security dashboard.
  * Estimate: 1d
  * Owner: Platform

* TEST-1: Integration tests for API routes
  * Mock Clash Royale and Gemini; test happy paths and error modes.
  * Acceptance: Vitest suite green; coverage on `lib/` ≥ 70%.
  * Estimate: 4d
  * Owner: QA/Backend

* TEST-2: E2E tests (Playwright)
  * Cover onboarding, recommendation, deck guide, login/logout, and feedback flow.
  * Acceptance: CI runs headless; artifacts on failure.
  * Estimate: 4d
  * Owner: QA/Web


### [Epic] Security, Privacy, and Compliance

* SEC-1: Data retention & export/delete
  * Add account-level data export (JSON) and full delete; clear recommendations/feedback on delete.
  * Acceptance: UI on `/account`; audit log entries; docs updated.
  * Dependencies: Auth, DB.
  * Estimate: 4d
  * Owner: Backend

* SEC-2: Cookie consent and privacy copy
  * Consent banner for analytics; privacy policy update reflecting data flows.
  * Acceptance: Banner appears only when analytics key present; consent stored; GA-free.
  * Estimate: 2d
  * Owner: Web/PM

* SEC-3: Threat model & rate limit review
  * Document attack surface; pen-test the public routes and rate limiter.
  * Acceptance: `docs/security.md`; action items filed.
  * Estimate: 2d
  * Owner: Platform


### [Epic] Feature Flags & Experimentation

* FLG-1: Lightweight flag system
  * Add environment and remote-config flags (file-based to start); helpers in `lib/`.
  * Acceptance: Flags used to gate Coach v2 and REC-3.
  * Estimate: 2d
  * Owner: Platform

* FLG-2: Assignment and exposure events
  * Ensure analytics capture flag variants and exposures for evaluation.
  * Acceptance: PostHog shows variant metrics.
  * Estimate: 2d
  * Owner: Data


### [Epic] Discovery & Social (Optional Stretch)

* SOC-1: Shareable deck guide previews
  * OG images and sharable links for deck guides (no PII).
  * Acceptance: Cards render on Discord/Twitter; Lighthouse checks.
  * Estimate: 2d
  * Owner: Web

* SOC-2: Filters & tags in recommendations
  * Let users filter by elixir cost, archetype, difficulty; save preferences to profile.
  * Acceptance: Filters persisted and applied.
  * Estimate: 3d
  * Owner: Web


## Quarter-by-Quarter Plan (Suggested Order)

Q4 2025
* ANA-1, ANA-2, API-1, API-2, CAT-1, CAT-2, COACH-3, UX-1

Q1 2026
* PDR-1, PDR-2, REC-1, REC-2, COACH-1, COACH-2, FLG-1

Q2 2026
* CI-1, TEST-1, TEST-2, PERF-1, PERF-2, A11Y-1, I18N-1

Q3 2026
* REC-3, PERF-3, SEC-1, SEC-2, SEC-3, FLG-2, SOC-1, SOC-2


## Risks and Mitigations

* External API limits/outages (Clash Royale, Gemini): keep fallbacks, cache aggressively, add circuit breakers and backoff.
* Model changes: prefer structured JSON with strict parsing and normalisation; keep deterministic content path.
* Asset licensing: verify card art licensing; prefer official/open assets or user-provided placeholders.
* Privacy & trust: minimize PII, transparent copy, easy delete/export.


## Engineering Principles (Keep Following)

* Server-only keys behind route handlers; never expose in client.
* Prefer server components; use client components only for interactivity.
* Use `cn()` for class merging and CVA for variants.
* Strong typing end-to-end; no `any`—prefer `unknown` with parsing.
* Tests for public behavior; cache keys and env-sensitive logic covered by unit tests.


## Operational Checklists

* Release checklist
  * [ ] Lint, typecheck, tests green
  * [ ] Migrations applied (`prisma migrate deploy`)
  * [ ] ENV changes documented in README and `.env.example`
  * [ ] Sentry release created (if DSN set)

* Incident checklist
  * [ ] Identify failing route and error rates in Sentry
  * [ ] Toggle feature flags to safe defaults
  * [ ] Roll back last deploy if necessary; communicate in README status badge


## Open Questions

* Monetization: Should we explore optional premium features (saved coach plans, deeper analytics)?
* Platform: Vercel vs Heroku for cron and edge capabilities—finalize and document.
* Community features: Are team/clan features in scope for v1?


## Pointers to Code (for new contributors)

* Scoring: `src/lib/scoring.ts`
* Gemini explainers: `src/lib/gemini.ts`
* Clash Royale integration: `src/lib/clash-royale.ts`
* Routes: `src/app/api/**/route.ts`
* Auth & Prisma: `src/lib/auth.ts`, `src/lib/prisma.ts`, `prisma/schema.prisma`
* UI primitives: `src/components/ui/*`
* Feature components: `src/components/features/*`
