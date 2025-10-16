# Decksy AI Repository Agent Guidelines

> **Mission:** Help Clash Royale players pick decks that fit their **cards, trophies, and playstyle**, then coach them to win more—using Clash Royale API data + an AI explainer (Google Gemini).

---

## About This Repository

**Decksy AI** is a Next.js 14 App Router application that provides personalized Clash Royale deck recommendations based on:
- Player card collection (via Clash Royale API)
- Trophy range and arena
- Playstyle preferences (quiz-based)
- AI-powered explanations and coaching (Google Gemini)

**Note:** Also see `.github/copilot-instructions.md` for GitHub Copilot-specific guidance on code patterns and workflows.

---

## Technology Stack

### Core
- **Framework:** Next.js 14+ (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS (dark theme by default)
- **UI Components:** Radix UI primitives + class-variance-authority
- **Hosting:** Vercel (planned)
- **Database:** PostgreSQL (Supabase) + Prisma ORM (planned)
- **Caching:** Redis (planned)

### Integrations (Planned)
- **Clash Royale API:** Player data, cards, battles (server-only)
- **Google Gemini API:** AI explanations, substitutions, matchup advice (JSON schema mode)
- **Stripe:** Subscription payments (Pro tier)
- **Auth:** Auth.js or Clerk
- **Analytics:** PostHog
- **Monitoring:** Sentry

---

## Design System

### Theme Colors (Dark Mode)
All color tokens are defined in `tailwind.config.ts`:
- **Background:** `#0B0F19` (near-black blue) → `bg-background`
- **Surface:** `#101623` / `#121829` → `bg-surface` / `bg-surface-muted`
- **Primary:** `#5B8CFF` (Royal blue) → `text-primary` / `bg-primary`
- **Accent:** `#22D3EE` (Cyan) → `text-accent` / `bg-accent`
- **Success:** `#10B981` | **Warning:** `#F59E0B` | **Danger:** `#EF4444`
- **Text Primary:** `#E6EAF2` | **Muted:** `#A9B4C2` | **Disabled:** `#64748B`
- **Borders:** `#1E293B` → `border-border`

### Typography
- **Fonts:** Inter (imported in `globals.css`)
- **Scale:** 12, 14, 16, 18, 20, 24, 32, 40px (responsive)
- **Weights:** 400/500 for body, 600/700 for headings

### Component Principles
- **Sleek & modern:** Card-based layouts with generous spacing
- **Hover states:** Cards use `hover:-translate-y-0.5` and `hover:border-primary/70`
- **Opacity patterns:** Borders typically use `/60` or `/80` opacity (e.g., `border-border/60`)
- **Icons:** lucide-react at size-4 (16px) or size-5 (20px)
- **Accessibility:** WCAG AA compliant, keyboard navigation, proper ARIA labels

---

## Project Structure

```
src/
  app/                  # Next.js App Router pages (route handlers, layouts)
    layout.tsx          # Root layout with dark theme setup
    page.tsx            # Landing page with hero, form, and features
  components/
    ui/                 # Reusable UI primitives
      button.tsx        # Radix Slot + CVA variants (primary, outline, ghost)
      card.tsx          # Card with hover effects
      container.tsx     # Max-width wrapper component
      gradient-text.tsx # Polymorphic gradient text component
    features/           # Feature-specific components (not yet created)
  lib/
    utils.ts            # cn() utility for Tailwind class merging
  styles/
    globals.css         # Tailwind imports + global styles
public/                 # Static assets
.github/                # Agent guidelines (this file + copilot-instructions.md)
```

**Import Pattern**: Always use `@/*` aliases (e.g., `import { cn } from "@/lib/utils"`), never relative paths.

---

## Key Features & User Flow

### MVP User Journey
1. **Landing Page:** User enters Clash Royale Player Tag
2. **Data Fetch:** Retrieve player profile, card collection, recent battles via Clash Royale API
3. **Playstyle Quiz:** Quick assessment (aggro, control, combo preferences)
4. **Scoring Engine:** Rule-based algorithm scores decks based on:
   - Card levels and availability (player's collection)
   - Trophy range and arena (matchmaking context)
   - Playstyle match (quiz results)
   - Meta relevance (current season data)
5. **Top Recommendations:** Display 1-3 best decks with score breakdown
6. **AI Explainer:** Gemini generates (using JSON schema mode):
   - Why this deck fits the player
   - Card substitutions (if missing cards)
   - Matchup tips and coaching notes
   - Win condition strategies
7. **Actions:** Copy deck link, share, save to history (post-auth)
8. **Feedback Loop:** Collect win/loss data after 10 battles (Pro tier)

### Implemented API Routes
- `GET /api/player/:tag` – Clash Royale profile fetch with Redis caching and mock fallback
- `GET /api/battles/:tag` – Recent battle log (external fetch with graceful mock fallback)
- `POST /api/recommend` – Deterministic scoring + Gemini explainers + persistence/in-memory fallback
- `POST /api/coach` – Gemini-powered coaching explainer stub
- `POST /api/feedback` – Persists feedback (Prisma) or stores in-memory when DB absent
- `GET /api/history` – Lists recent recommendation sessions
- `POST /api/stripe/checkout` – Stripe checkout stub for Pro upsell experiments

Additional planned endpoints (`/api/stripe/*` webhooks, auth callbacks) remain TODO.

---

## Development Guidelines

### Code Style & Patterns
- **TypeScript:** Strict mode enabled, no `any` types, prefer `interface` over `type`
- **Components:** Functional components with `React.forwardRef` for all UI primitives
- **Variants:** Use `class-variance-authority` (CVA) for component styling variants
- **Composition:** Prefer Radix UI's `asChild` pattern (see `button.tsx` example)
- **Class merging:** Always use `cn()` utility from `lib/utils.ts` to merge Tailwind classes

### Component Creation Pattern
```typescript
// src/components/ui/example.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const exampleVariants = cva("base-classes", {
  variants: { variant: { default: "...", outlined: "..." } },
  defaultVariants: { variant: "default" }
});

interface ExampleProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof exampleVariants> {}

const Example = React.forwardRef<HTMLDivElement, ExampleProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(exampleVariants({ variant }), className)} {...props} />
  )
);
Example.displayName = "Example";

export { Example, exampleVariants };
```

### Security & Performance
- **API Keys:** Store in `.env.local`, never commit, never expose to client
- **Server-only APIs:** Keep Clash Royale & Gemini API calls in Route Handlers (`app/api/*/route.ts`)
- **Rate limiting:** Implement on all public API routes (TBD)
- **Input validation:** Use Zod schemas for all user inputs (TBD)
- **Caching strategy:**
  - Cache Clash Royale API responses (5-10 min TTL in Redis)
  - Cache Gemini outputs keyed by deck composition + player context
  - Use React Server Components by default

### Testing
- Unit tests for `lib/utils.ts` functions (TBD)
- Integration tests for API routes with mocked external services (TBD)
- LLM output validation using JSON schema mode (TBD)

---

## Environment Setup

1. Copy `.env.example` to `.env` and populate secrets (see template below).
2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npx prisma generate
   ```
3. Initialise the Postgres schema:
   ```bash
   # local development (creates migration files if they do not exist)
   npx prisma migrate dev --name init

   # production / CI (applies existing migrations only)
   npx prisma migrate deploy
   ```
4. (Optional) Connect Redis. If `REDIS_URL` is not set the caching helpers fall back to an in-memory Map—perfectly fine for local development.

Use `redis://localhost:6379` for a local Redis instance or supply your Upstash URL in production.

## Environment Variables

```env
# Clash Royale API
CLASH_ROYALE_API_KEY=

# Google Gemini
GEMINI_API_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# Redis
REDIS_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_BASE_URL=

# Monitoring
SENTRY_DSN=
```

---

## Git & PR Guidelines

- **This `.github` directory** is ignored in version control except for documentation
- **Do NOT** place GitHub Actions workflows here; it's reserved for agent meta-instructions
- **Branch naming:** `feature/`, `fix/`, `refactor/`, `docs/`
- **Commits:** Use conventional commits (feat:, fix:, docs:, etc.)
- **PR descriptions:** 
  - Summarize key code changes
  - List tests run and results
  - Reference related issues/tickets
  - Include screenshots for UI changes

---

## Current Development Status

### ✅ Completed
- Project scaffolding (Next.js 14 + TypeScript + Tailwind)
- Design system foundation (color tokens, typography)
- Core UI primitives & layout shell
- Player onboarding, quiz, recommendation dashboard, deck guide, and history pages
- Deterministic scoring engine wired to curated deck catalog
- Clash Royale adapters with caching + mock fallbacks
- Gemini integration with resilient fallback copy
- Prisma schema, env validation helpers, Redis utilities, and stubbed Stripe checkout handler

### 🚧 In Progress
- Account system (Auth.js/Clerk) and persisted user sessions
- Production-ready Stripe subscriptions + webhook processing
- Analytics, monitoring, and structured logging
- Automated Prisma migrations + deck catalog seeding in CI

### 📋 Planned (MVP Enhancements)
- Copy/share deck interactions & telemetry
- Aggregated feedback insights across sessions
- Intelligent substitutions driven by live collection deltas

### 🚀 Post-MVP
- Advanced recommendation history tied to authenticated users
- Feedback loop with battle tracking and coaching follow-ups
- Stripe Pro billing portal + plan management
- Flex deck slots & upgrade path planning tools

---

## Useful Commands

```bash
npm install          # First-time setup
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (check bundle size)
npm run lint         # ESLint checks
```

---

## Resources & References

- **Full Project Spec:** See `Project_Spec.md` in this directory for detailed requirements
- **GitHub Copilot Instructions:** See `copilot-instructions.md` for code patterns and workflows
- **Clash Royale API:** https://developer.clashroyale.com/
- **Google Gemini API:** https://ai.google.dev/docs
- **Design System:** All tokens defined in `tailwind.config.ts`
- **Component Patterns:** Based on shadcn/ui + Radix UI primitives

---

## Agent-Specific Quick Reference

When working on this repository:

1. **Always use `@/*` imports** - never relative `../../` paths
2. **Maintain dark theme consistency** - use color tokens from `tailwind.config.ts`
3. **Keep API keys server-side** - never expose in client components
4. **Use TypeScript strictly** - no `any` types, prefer `interface` over `type`
5. **Follow component patterns** - see `src/components/ui/button.tsx` as reference
6. **Use `cn()` for all class merging** - from `lib/utils.ts`
7. **Default to server components** - only use `"use client"` when needed
8. **Implement proper error handling** - for all API calls and LLM interactions
9. **Cache aggressively** - external API data already cached; extend to Gemini outputs next
10. **Prioritize accessibility** - WCAG AA is not optional

For detailed information on:
- **Scoring logic:** See Section 7 in `Project_Spec.md`
- **LLM prompts:** See Section 8 in `Project_Spec.md`
- **Data model:** See Section 5 in `Project_Spec.md`
- **API design:** See Section 9 in `Project_Spec.md`
- **Roadmap:** See Section 13 in `Project_Spec.md`

---

**Last Updated:** November 24, 2025
**Project Status:** Core recommendation flow implemented; authentication, billing, and analytics pending
