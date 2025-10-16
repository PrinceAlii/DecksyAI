# Decksy AI — Product & Tech Spec

> **Mission:** Help Clash Royale players pick decks that fit their **cards, trophies, and playstyle**, then coach them to win more—using Clash Royale API data + an AI explainer (Google Gemini).

---

## 0) TL;DR Requirements

- **Platform:** Web app (Next.js + TypeScript)
- **Hosting:** Vercel
- **Design:** Dark theme (sleek, modern, minimal), accessible
- **Data sources:** Clash Royale API (player, cards, battles), internal deck catalog (JSON/DB)
- **AI:** Google Gemini API (text generation + JSON output)
- **MVP:** Player imports tag → quick playstyle quiz → top 1–3 recommended decks → explainer & substitutions → copy/share → optional Pro features (Stripe)
- **Monetization:** Freemium + subscription (Pro)

---

## 1) Product Brief

### 1.1 Problem
Picking a Clash Royale deck is confusing: metas shift, card levels matter, and not every player enjoys (or is good at) every archetype.

### 1.2 Solution
Decksy AI recommends **personalized decks** that align with your **collection, trophy range, and playstyle**, then explains *why* they fit and how to pilot them. AI is used for **explanations, coaching tips, and safe substitutions**, not raw matchmaking predictions.

### 1.3 Users
- **New/returning players:** want a simple, effective deck to climb.
- **Mid-ladder grinders:** want recommendations that respect card levels and comfort.
- **Learners:** want concise matchup notes and “what to do” guidance.

### 1.4 Success Metrics
- Tag → recommendation conversion rate
- Time on guide page & copy-deck clicks
- Feedback rating on recommended deck (thumbs up/down)
- Retention (repeat sessions/week)
- Pro conversion rate

---

## 2) Brand & Visual Design

### 2.1 Style
- **Vibe:** modern, sleek, focused; minimal ornamentation
- **Layout:** grid-based cards, generous spacing, crisp icons
- **Micro-interactions:** subtle hover/focus states; smooth transitions

### 2.2 Dark Theme Tokens
- **Background:** `#0B0F19` (near-black blue)  
- **Surface:** `#101623` / `#121829`  
- **Primary:** `#5B8CFF` (Royal blue)  
- **Accent:** `#22D3EE` (Cyan)  
- **Success:** `#10B981`; **Warning:** `#F59E0B`; **Danger:** `#EF4444`  
- **Text (primary):** `#E6EAF2`; **muted:** `#A9B4C2`; **disabled:** `#64748B`  
- **Borders:** `#1E293B`; **Card shadow:** soft, minimal

### 2.3 Typography
- **Display:** Inter or Satoshi (600/700 for headings)  
- **Body:** Inter 400/500  
- **Sizes:** 12, 14, 16, 18, 20, 24, 32, 40 (responsive scale)

### 2.4 Components
- App shell (top nav, user menu)
- Input card (Player Tag)
- Quiz (radio/slider chips)
- Deck cards (8 card tiles, elixir avg, tags)
- Score breakdown (pill badges)
- Explainer panel (AI content with bullets)
- Substitutions mini-table
- Matchup notes accordion
- Toasts, modals, skeleton loaders

---

## 3) Information Architecture & Navigation

- **/ (Home):** Value prop, “Enter your Player Tag”, CTA to start quiz
- **/recommend:** Results (top 1–3 decks), score breakdown, copy/share
- **/deck/[slug]:** Detailed guide (explainer, subs, matchup notes)
- **/history:** Your past recommendations & feedback
- **/account:** Plan, billing (Pro), API connections, profile
- **/login:** Auth
- **/privacy, /terms:** Legal

---

## 4) User Flows

```mermaid
flowchart TD
A[Landing] --> B[Enter Player Tag]
B --> C[Fetch Player + Cards + Battles]
C --> D[Quick Playstyle Quiz]
D --> E[Score Decks (rule-based)]
E --> F[Top 1–3 Decks]
F --> G[Select Deck]
G --> H[Gemini Explainer + Subs + Matchups]
H --> I[Copy Deck / Share / Save]
I --> J[Feedback after 10 battles]
```

---

## 5) Data Model & Storage

- **User, Profile, DeckCatalog, Recommendation, Explainer, Feedback, Billing, AuditLog** (see `prisma/schema.prisma`)
- Use **Postgres + Prisma** (Prisma client initialises only when `DATABASE_URL` is provided; otherwise the app falls back to in-memory stores)
- Cache API responses and LLM outputs in Redis (falls back to in-memory Map when `REDIS_URL` is absent)

---

## 6) External Integrations

- Clash Royale API (server-only)
- Gemini API (JSON schema, text generation)
- Stripe (subscription)
- Auth.js or Clerk (authentication)
- PostHog (analytics)
- Sentry (monitoring)

---

## 7) Scoring Engine (Deterministic, MVP)

Use trophy, arena, card levels, and playstyle quiz to calculate deck scores.

---

## 8) LLM Prompts (Gemini)

Define schema-based JSON responses with explainer, substitutions, and matchup tips.

---

## 9) API Design

- `/api/player/:tag`
- `/api/battles/:tag`
- `/api/recommend`
- `/api/coach`
- `/api/feedback`
- `/api/history`
- `/api/stripe/checkout`
- `/api/stripe/*` (webhooks – pending)

---

## 10) Security, Privacy, Compliance

Server-only keys, rate limiting, validated input, data minimization, privacy policy.

---

## 11) Deployment

Vercel hosting, Supabase DB, Redis caching, environment variables for API keys.

---

## 12) Jira Tasks

Epics:
1. Foundations (scaffolding, design system)
2. Integrations (Clash API, Gemini)
3. Data Layer (DB, cache)
4. Core Features (tag flow, quiz, scoring, coach, results UI)
5. Feedback & History
6. Pro & Payments
7. Analytics & QA

---

## 13) Roadmap

**MVP (Weeks 1–3):**
- Player tag, quiz, scoring, LLM explainers, dark UI

**v1.1+:**
- Stripe Pro, history, flex slots, upgrade paths

---

## 14) Operational Notes

- **Environment template:** Duplicate `.env.example` to `.env` and fill in credentials. `DATABASE_URL`/`DIRECT_URL` should point at your Postgres instance; `REDIS_URL` can be `redis://localhost:6379` for local dev or your Upstash endpoint in production.
- **Prisma workflow:** After installing dependencies, run `npx prisma generate`. Apply schema changes with `npx prisma migrate dev --name init` locally or `npx prisma migrate deploy` in CI/production. Without `DATABASE_URL`, Prisma is skipped and the app writes to the in-memory recommendation store.
- **Redis fallback:** If `REDIS_URL` is unset the caching layer automatically uses a transient in-memory Map, which is acceptable for local testing but not for production.
