# Developer Guidance for Decksy AI (Combined)

This file is a copy of the merged `.github` documentation and contains developer guidance, coding patterns, and project conventions.

## Overview

Decksy AI is a Next.js 14 App Router application that provides Clash Royale players with personalized deck recommendations powered by AI. The app analyzes player data via the Clash Royale API, scores decks using a rules-based engine, and generates coaching insights with Google Gemini.

### Key points
- Use `@/*` imports (configured via `tsconfig.json`).
- UI primitives live in `src/components/ui/` and use `React.forwardRef`.
- Use `cva` (class-variance-authority) for component variants and export variant types.
- Use a `cn()` helper for Tailwind class composition (avoid manual string concat).
- Keep LLM/third-party API keys server-side and behind route handlers.

For full project guidance, see `.github/AGENTS.md` and `Project_Spec.md`.

**Last updated:** November 24, 2025
# Developer Guidance for Decksy AI

## Project Overview
Decksy AI is a Next.js 14 App Router application that provides Clash Royale players with personalized deck recommendations powered by AI. The app analyzes player data via the Clash Royale API, scores decks using a rules-based engine, and generates coaching insights with Google Gemini.

## Architecture & Key Patterns

### Tech Stack
````instructions
# Developer Guidance for Decksy AI

## Project Overview
Decksy AI is a Next.js 14 App Router application that provides Clash Royale players with personalized deck recommendations powered by AI. The app analyzes player data via the Clash Royale API, scores decks using a rules-based engine, and generates coaching insights with Google Gemini.

## Architecture & Key Patterns

### Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript (strict mode), Tailwind CSS
- **UI Components:** Radix UI primitives + class-variance-authority for variants
- **Design System:** Dark-first theme with custom color tokens (see `tailwind.config.ts`)
- **Backend:** Prisma ORM targeting PostgreSQL (automatically disabled when `DATABASE_URL` is missing)
- **Caching:** Redis via `ioredis` (falls back to in-memory Map when `REDIS_URL` is missing)
- **Integrations:** Clash Royale API adapters, Gemini explainers
- **Planned:** Auth.js/Clerk, analytics/monitoring

### Import Aliases
- Use `@/*` for all `src/*` imports (configured in `tsconfig.json`)
- Example: `import { cn } from "@/lib/utils"`

### Component Patterns
1. **Composition over props**: Use Radix UI's `Slot` pattern for polymorphic components
   - Example: `<Button asChild><Link href="...">Text</Link></Button>`
   
2. **Variant-based styling**: All UI components use `cva` from class-variance-authority
   - Define variants in component file, export both component and variants
   - Example: `buttonVariants` in `src/components/ui/button.tsx`

3. **TypeScript interfaces**: Extend React HTML element types, use `VariantProps` for CVA
   ```typescript
   interface ButtonProps 
     extends React.ButtonHTMLAttributes<HTMLButtonElement>,
       VariantProps<typeof buttonVariants> {
     asChild?: boolean;
   }
   ```

4. **Forwarded refs**: All UI components use `React.forwardRef` for ref forwarding

### Design System Usage

**Color Tokens** (from `tailwind.config.ts`):
- Background: `bg-background` (#0B0F19)
- Surface: `bg-surface` (#101623), `bg-surface-muted` (#121829)
- Primary: `text-primary` / `bg-primary` (#5B8CFF - Royal blue)
- Accent: `text-accent` / `bg-accent` (#22D3EE - Cyan)
- Text: `text-text` (#E6EAF2), `text-text-muted` (#A9B4C2)
- Borders: `border-border` (#1E293B)

**Component Guidelines**:
- Cards: Always use `border-border/60` with opacity, add hover states with `hover:-translate-y-0.5`
- Buttons: Default to `primary` variant, use `outline` for secondary actions
- Typography: Inter font, semantic heading hierarchy
- Icons: Use `lucide-react` at size-4 (16px) or size-5 (20px)

### Utility Functions

**`cn` helper** (`src/lib/utils.ts`):
```typescript
cn(...inputs: ClassValue[]) // Merges Tailwind classes with conflict resolution
```
Use this for ALL className concatenation to avoid Tailwind conflicts.

## Development Workflows

### Running the App
```bash
npm install          # First-time setup
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint checks
```

### Database & Cache Setup (Heroku)
- This project is designed to run on Heroku in production. Use the Heroku Postgres and Heroku Redis addons for production instances.
- Link the GitHub repository to the Heroku app for automatic deploys, or deploy via the Heroku CLI.

Steps (Heroku):

1. Create a Heroku app and provision addons:
   - `heroku addons:create heroku-postgresql:hobby-dev`
   - `heroku addons:create heroku-redis:hobby-basic`

2. Link the app to your GitHub repo `PrinceAlii/DecksyAI` in the Heroku dashboard under "Deploy" and enable automatic deploys from `main`, or push via the Heroku CLI.

3. Set config vars (Heroku Dashboard → Settings → Config Vars) such as `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GEMINI_API_KEY`, etc. Heroku will populate the addon-provided values for `DATABASE_URL` and `REDIS_URL` automatically.

4. Generate the Prisma client as part of your build or deployment step: `npx prisma generate`. For migrations in production use `npx prisma migrate deploy`.

Local development:

- Copy `.env.example` to `.env` and populate credentials. For local development it's fine to use `redis://localhost:6379` and a local Postgres instance, or rely on the in-memory fallbacks for quick iterations.

### File Structure Conventions
```
src/
  app/              # Next.js App Router pages (route handlers, layouts)
  components/
    ui/             # Reusable primitives (button, card, etc.)
    features/       # Feature-specific components (not yet created)
  lib/
    utils.ts        # Shared utilities (cn, formatters, etc.)
  styles/
    globals.css     # Tailwind imports + global styles
```

### Creating New Components
1. Use functional components with TypeScript
2. Export both the component and any variants/types
3. Place in `src/components/ui/` for primitives, `src/components/features/` for domain-specific
4. Use `forwardRef` if the component needs ref access
5. Add `displayName` for better debugging

Example:
```typescript
const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(baseStyles, className)} {...props} />;
  }
);
MyComponent.displayName = "MyComponent";
```

## Security & Performance

### API Integration
- **Never expose API keys**: All external API calls (Clash Royale, Gemini) must be server-side
- Route handlers live under `app/api/*/route.ts`; keep request validation close to the handler
- Implement rate limiting on public routes (TODO)
- Validate inputs with Zod schemas before API calls (body schemas live beside each handler)

### Caching Strategy
- Cache Clash Royale API responses (5-10 min TTL in Redis)
- Cache Gemini outputs keyed by deck + player context (TODO)
- Use React Server Components for static content

### Performance Best Practices
- Lazy load heavy components (deck visualizations, charts)
- Use Next.js `<Image>` component with proper sizing
- Prefer server components over client components where possible
- Keep client bundles small (check with `npm run build`)

## TypeScript Guidelines

### Strict Mode Enabled
- No `any` types (use `unknown` if truly dynamic)
- Prefer `interface` for public APIs, `type` for unions/intersections
- Always type function parameters and return values
- Use `React.ComponentProps<typeof Component>` to extract component props

### Common Patterns
```typescript
// Component props
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined";
}

// Polymorphic components
interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: keyof JSX.IntrinsicElements;
}

// API response types (when backend exists)
interface PlayerData {
  tag: string;
  name: string;
  trophies: number;
  cards: CardInfo[];
}
```

## Testing & Validation

### Current State
- Vitest unit coverage for prompt helpers (`npm test`)
- Manual testing via dev server
- ESLint for code quality

### When Implementing Tests
- Unit tests for `lib/utils.ts` functions
- Integration tests for API routes with mocked external services
- LLM output validation using JSON schema mode

## Common Gotchas

1. **TypeScript Path Aliases**: Always use `@/*` imports, not relative `../../` paths
2. **Client vs Server Components**: Default to server components; only add `"use client"` when needed (interactivity, hooks, browser APIs)
3. **Tailwind Class Order**: Use `cn()` to merge classes properly - never concatenate strings directly
4. **Dark Theme Only**: No light mode toggle - design system is dark-native
5. **Component Composition**: Prefer `asChild` pattern over wrapping elements for links/buttons
6. **Experimental Features**: `typedRoutes: true` in `next.config.mjs` enables type-safe routing

## Questions or Clarifications

- **Full Requirements**: See `.github/AGENTS.md` for detailed feature specs
- **Design Details**: Refer to AGENTS.md sections on theme colors and typography
- **API Design**: See AGENTS.md for the currently implemented route surface + remaining TODOs
- **Scoring Logic**: Deterministic engine lives in `src/lib/scoring.ts` (spec Section 7 covers weighting rationale)

---

**Last Updated:** November 24, 2025
**Project Status:** Core recommendation loop shipped; auth and analytics still pending

````
