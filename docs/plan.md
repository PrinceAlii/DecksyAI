# Decksy AI Delivery Plan (Update)

## Recently Completed
- Hardened Gemini explainer pipeline with JSON responses, multi-model fallback (`gemini-2.5-flash` → `gemini-2.0-flash-lite`) and Redis-backed caching so users stop seeing "model not found" errors.
- Captured the latest Gemini API model matrix to keep integration choices in sync with Google's published availability.

## In Flight / Next Up
1. **Structured prompt refinements** – introduce Zod schema validation on the client response objects shared with the UI, and add regression tests around the JSON parsing helper.
2. **Player context enrichment** – incorporate collection deltas into the Gemini prompt so substitutions reflect missing cards, then persist explainer payloads for history replay once the database is live.
3. **Observability** – pipe Gemini call metadata (model used, latency, cache hits) into the planned analytics/monitoring stack (PostHog + Sentry) to spot degradation quickly.
4. **Feature polish** – surface "last updated" timestamps for explainers in the dashboard and expose model selection in admin settings for rapid experiments.

## Risks & Mitigations
- **Model churn**: Keep the fallback chain updated and schedule a weekly check against the models endpoint; alert when preferred model returns non-200 responses.
- **Prompt drift**: Log anonymized prompts/responses behind a feature flag so we can tune wording without spamming the live API.

## Milestones
- **Week 1**: Ship observability hooks + admin model toggle.
- **Week 2**: Persist explainer payloads with Prisma + surface history replay.
- **Week 3**: Bundle structured prompt tests into CI and gate releases on them.
