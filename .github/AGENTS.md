# Decksy - Combined Agent Documentation

> **Mission:** Help Clash Royale players pick decks that fit their **cards, trophies, and playstyle**, then coach them to win more - using Clash Royale API data + an AI explainer (Google Gemini).

---

## Contents

- AGENTS overview & guidelines (merged)
- Copilot instructions & code patterns
- Gemini model snapshot
- Delivery plan
- Project spec (full)

---

## AGENTS Overview

The core agent guidelines are documented in `AGENTS.md` (the shorter version). This combined file includes additional reference sections from the `.github` folder:

 - `developer-guidance.md` — Developer-specific developer & style guidance
- `gemini-models.md` — Gemini API model snapshot
- `plan.md` — Delivery & release notes / plan
- `Project_Spec.md` — Full product & technical specification

Refer to the individual files for single-topic views; this combined document is useful when you need everything in one place.

---

### Recent implementation notes (October 2025)

- The shared `RecommendationResults` component now accepts an optional `showHistoryNavigation` flag so it can embed cleanly inside history detail views without duplicating navigation controls. Pass the same option to `RecommendationResultsSkeleton` when you need a matching fallback.

---

## Copilot Instructions (excerpt)

This project follows strict TypeScript, component, and repo conventions to keep code consistent and maintainable. Key points:

- Use `@/*` imports (configured via `tsconfig.json`).
- UI primitives live in `src/components/ui/` and use `React.forwardRef`.
- Use `cva` (class-variance-authority) for component variants and export variant types.
- Use a `cn()` helper for Tailwind class composition (avoid manual string concat).
- Keep LLM/third-party API keys server-side and behind route handlers.

See the full `copilot-instructions.md` for concrete patterns and examples.

---

## Gemini Model Snapshot

Source: Gemini API models reference (snapshot captured while documenting the project).

Generally available models include:
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`

Preview and specialized variants are also listed in `gemini-models.md`.

---

## Delivery Plan (excerpt)

Recent highlights:

- Account and auth flows shipped (Auth.js, magic links, GitHub)
- Recommendation UI refinements and layout fixes
- Gemini prompt improvements and Vitest tests for prompt helpers

Next priorities include card art sourcing, accessibility validation, dependency security (npm audit), and analytics/monitoring.

---

## Project Spec (summary)

Full product & technical spec is included in `Project_Spec.md`. It covers:

- Product brief and requirements
- Information architecture and navigation
- Data model and Prisma schema notes
- Scoring engine and LLM prompt designs
- Deployment and operational notes (Heroku, Postgres, Redis)

---

**Last updated:** 17 October, 2025