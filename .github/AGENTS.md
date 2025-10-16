# Decksy AI Repository Agent Guidelines

> **Mission:** Help Clash Royale players pick decks that fit their **cards, trophies, and playstyle**, then coach them to win more—using Clash Royale API data + an AI explainer (Google Gemini).

---

## About This Repository

**Decksy AI** is a Next.js web application that provides personalized Clash Royale deck recommendations based on:
- Player card collection (via Clash Royale API)
- Trophy range and arena
- Playstyle preferences (quiz-based)
- AI-powered explanations and coaching (Google Gemini)

---

## Technology Stack

### Core
- **Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling:** Tailwind CSS (dark theme by default)
- **Hosting:** Vercel
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Caching:** Redis

### Integrations
- **Clash Royale API:** Player data, cards, battles (server-only)
- **Google Gemini API:** AI explanations, substitutions, matchup advice (JSON schema mode)
- **Stripe:** Subscription payments (Pro tier)
- **Auth:** Auth.js or Clerk
- **Analytics:** PostHog
- **Monitoring:** Sentry

---

## Design System

### Theme Colors (Dark Mode)
- **Background:** `#0B0F19` (near-black blue)
- **Surface:** `#101623` / `#121829`
- **Primary:** `#5B8CFF` (Royal blue)
- **Accent:** `#22D3EE` (Cyan)
- **Success:** `#10B981` | **Warning:** `#F59E0B` | **Danger:** `#EF4444`
- **Text Primary:** `#E6EAF2` | **Muted:** `#A9B4C2` | **Disabled:** `#64748B`
- **Borders:** `#1E293B`

### Typography
- **Fonts:** Inter or Satoshi (600/700 for headings, 400/500 for body)
- **Scale:** 12, 14, 16, 18, 20, 24, 32, 40px (responsive)

### Component Principles
- **Sleek & modern:** Grid-based cards, generous spacing, crisp icons
- **Accessibility:** WCAG AA compliant, keyboard navigation, proper ARIA labels
- **Micro-interactions:** Subtle hover/focus states, smooth transitions

---

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/
    ui/             # Reusable UI components (button, card, etc.)
  lib/
    utils.ts        # Utility functions (cn, etc.)
  styles/
    globals.css     # Global styles, Tailwind imports
public/             # Static assets
.github/            # Agent guidelines (not tracked in git)
```

---

## Key Features & User Flow

1. **Landing Page:** User enters Clash Royale Player Tag
2. **Data Fetch:** Retrieve player profile, card collection, recent battles
3. **Playstyle Quiz:** Quick assessment (aggro, control, combo preferences)
4. **Scoring Engine:** Rule-based algorithm scores decks based on:
   - Card levels and availability
   - Trophy range and arena
   - Playstyle match
   - Meta relevance
5. **Top Recommendations:** Display 1-3 best decks with score breakdown
6. **AI Explainer:** Gemini generates:
   - Why this deck fits
   - Card substitutions (if missing cards)
   - Matchup tips and coaching notes
7. **Actions:** Copy deck, share link, save to history
8. **Feedback Loop:** Collect win/loss data after 10 battles

---

## API Routes

- `GET /api/player/:tag` - Fetch player data from Clash Royale API
- `GET /api/battles/:tag` - Fetch recent battles
- `POST /api/recommend` - Generate deck recommendations
- `POST /api/coach` - Get AI coaching for specific deck
- `POST /api/feedback` - Submit deck feedback
- `POST /api/stripe/*` - Stripe webhook & subscription management

---

## Development Guidelines

### Code Style
- **TypeScript:** Use strict mode, avoid `any`, prefer interfaces over types
- **Components:** Functional components with TypeScript props
- **Naming:** camelCase for variables/functions, PascalCase for components
- **File organization:** Colocate related files, use barrel exports (`index.ts`)

### Security
- **API Keys:** Store in `.env.local`, never commit
- **Server-only:** Keep Clash Royale & Gemini API calls server-side
- **Rate limiting:** Implement on all public API routes
- **Input validation:** Sanitize all user inputs (Zod schemas)

### Testing
- Write unit tests for utility functions
- Test API routes with mock data
- Validate LLM prompt outputs with schema validation

### Performance
- Cache API responses (Redis, 5-10 min TTL)
- Cache LLM outputs (keyed by deck + player context)
- Optimize images, lazy load components
- Use React Server Components where possible

### Accessibility
- Semantic HTML elements
- Proper heading hierarchy (h1 → h6)
- Alt text for images
- Keyboard navigation support
- Color contrast WCAG AA

---

## Environment Variables

```env
# Clash Royale API
CLASH_ROYALE_API_KEY=

# Google Gemini
GEMINI_API_KEY=

# Database
DATABASE_URL=

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
- Project scaffolding (Next.js + TypeScript + Tailwind)
- Basic UI components (Button, Card, Container, GradientText)
- Design system foundation

### 🚧 In Progress
- Clash Royale API integration
- Database schema & Prisma setup
- Scoring engine logic
- Gemini prompt engineering

### 📋 Planned (MVP)
- Player tag input & validation
- Playstyle quiz component
- Deck recommendation UI
- AI explainer panel
- Copy/share functionality
- Responsive mobile design

### 🚀 Post-MVP
- User authentication
- Recommendation history
- Feedback system
- Stripe Pro subscription
- Flex deck slots
- Card upgrade paths

---

## Resources

- **Full Spec:** See `Decksy_AI_Project_Spec.md` in this directory
- **Clash Royale API:** https://developer.clashroyale.com/
- **Gemini API:** https://ai.google.dev/docs
- **Design Reference:** Follow spec color tokens and typography
- **Component Library:** Build on shadcn/ui patterns

---

## Agent-Specific Instructions

When working on this repository:

1. **Always check the full spec** (`Decksy_AI_Project_Spec.md`) for detailed requirements
2. **Maintain dark theme consistency** using the specified color tokens
3. **Keep API keys server-side** - never expose in client components
4. **Use TypeScript strictly** - no `any` types unless absolutely necessary
5. **Follow component patterns** established in `src/components/ui/`
6. **Implement proper error handling** for all API calls and LLM interactions
7. **Cache aggressively** - both external API data and LLM outputs
8. **Test edge cases** - missing cards, low card levels, new players
9. **Document complex logic** - especially scoring algorithms and prompt engineering
10. **Prioritize accessibility** - this is not optional

---

## Questions or Clarifications

For detailed information on:
- **Scoring logic:** See Section 7 in project spec
- **LLM prompts:** See Section 8 in project spec
- **Data model:** See Section 5 in project spec
- **API design:** See Section 9 in project spec
- **Roadmap:** See Section 13 in project spec
