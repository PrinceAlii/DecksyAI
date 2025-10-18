# Deck Builder - Feature Backlog

## Epic: Deck Builder Enhancements
**Status:** Ready for Development  
**Priority:** High  
**Created:** October 18, 2025  
**Project:** Decksy AI  

---

## 🎨 DECK-101: Polish AI Analysis Display with Modal UI

**Type:** Enhancement  
**Priority:** High  
**Story Points:** 5  
**Sprint:** Next  

### Description
Currently, AI deck analysis results are shown in a browser alert. We need to create a beautiful, professional modal/dialog to display the comprehensive Gemini analysis results in a visually appealing way.

### User Story
```
As a player building a custom deck,
I want to see AI analysis results in a beautiful, easy-to-read format,
So that I can understand my deck's strengths, weaknesses, and improvement suggestions at a glance.
```

### Acceptance Criteria
- [ ] Create modal/dialog component that opens when analysis completes
- [ ] Display analysis summary with proper formatting (2 paragraphs)
- [ ] Show strengths list with checkmark icons (max 3)
- [ ] Show weaknesses list with warning icons (max 3)
- [ ] Display card synergies with card names highlighted
- [ ] Show improvement suggestions with action-oriented formatting
- [ ] Create visual rating bars for offense/defense/versatility (1-10 scale)
- [ ] Add gradient styling for rating bars based on score
- [ ] Include "Save Analysis" button to persist to database
- [ ] Add "Close" button with smooth animation
- [ ] Modal should be responsive (mobile-friendly)
- [ ] Include loading state while analysis is generating

### Technical Notes
- Create `src/components/features/deck-builder/analysis-modal.tsx`
- Use Radix UI Dialog primitive for accessibility
- Add to `deck-builder-client.tsx` state management
- Store analysis in component state until saved
- Use Tailwind gradient utilities for rating bars
- Consider framer-motion for smooth animations

### Design Mockup
```
┌─────────────────────────────────────────┐
│  ✨ Deck Analysis                    [×] │
├─────────────────────────────────────────┤
│                                          │
│  Summary: (2 paragraphs with spacing)   │
│                                          │
│  ✓ Strengths                            │
│    • Fast cycle speed                   │
│    • Strong defensive options           │
│    • Spell versatility                  │
│                                          │
│  ⚠ Weaknesses                           │
│    • Weak to heavy beatdown             │
│    • Requires precise timing            │
│    • Level dependent                    │
│                                          │
│  🔗 Card Synergies                      │
│    Hog Rider + Ice Spirit               │
│    → Quick freeze pushes                │
│                                          │
│  💡 Suggestions                         │
│    • Practice spell prediction          │
│    • Master cycle timing                │
│                                          │
│  📊 Ratings                             │
│    Offense     ████████░░ 8/10          │
│    Defense     ███████░░░ 7/10          │
│    Versatility █████████░ 9/10          │
│                                          │
│  [Save Analysis]  [Close]               │
└─────────────────────────────────────────┘
```

### Dependencies
- Radix UI Dialog (already in project)
- Framer Motion (optional, for animations)

### Estimated Time
**30-45 minutes**

---

## 💾 DECK-102: Saved Decks Management Page

**Type:** Feature  
**Priority:** High  
**Story Points:** 8  
**Sprint:** Next  

### Description
Create a dedicated page at `/account/decks` where users can view, manage, edit, and load their saved custom decks. This completes the deck management lifecycle.

### User Story
```
As a player who has saved multiple decks,
I want a central place to view and manage all my custom decks,
So that I can easily switch between decks, edit them, or delete ones I no longer use.
```

### Acceptance Criteria
- [ ] Create `/account/decks` route (new page)
- [ ] Fetch user's decks from `/api/deck/custom` endpoint
- [ ] Display decks in grid layout (3 columns on desktop, 1 on mobile)
- [ ] Each deck card shows:
  - [ ] Deck name
  - [ ] 8 card thumbnails (4x2 grid)
  - [ ] Created date (relative: "2 days ago")
  - [ ] Average elixir cost
  - [ ] AI analysis badge (if analysis exists)
- [ ] Add "Load in Builder" button → opens deck builder with selected cards
- [ ] Add "Edit Name" button → inline edit or modal
- [ ] Add "Delete" button with confirmation dialog
- [ ] Add "Analyze" button → triggers AI analysis if not done yet
- [ ] Show empty state when user has no saved decks
- [ ] Add "Create New Deck" button → navigates to /deck-builder
- [ ] Sort decks by: Recently Updated (default), Name, Created Date
- [ ] Add loading skeletons while fetching decks
- [ ] Handle errors gracefully (show error message)

### Technical Notes
**New Files:**
- `src/app/account/decks/page.tsx` - Main page
- `src/components/features/account/saved-deck-card.tsx` - Deck card component
- `src/components/features/account/delete-deck-dialog.tsx` - Confirmation dialog

**API Integration:**
- GET `/api/deck/custom` - Fetch decks
- DELETE `/api/deck/custom?id=<deckId>` - Delete deck
- PATCH `/api/deck/custom` - Update deck name
- POST `/api/analyze/custom` - Analyze deck

**State Management:**
- Use React Query or SWR for data fetching (optional)
- Optimistic updates for delete/edit operations
- Cache invalidation after mutations

### UI Components Needed
```tsx
<SavedDecksPage>
  <PageHeader title="My Decks" />
  <SortControls />
  <DeckGrid>
    {decks.map(deck => (
      <SavedDeckCard
        deck={deck}
        onLoad={handleLoad}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
      />
    ))}
  </DeckGrid>
  <EmptyState /> // if no decks
</SavedDecksPage>
```

### Navigation Updates
- [ ] Add "My Decks" link to account page
- [ ] Update site header to show deck count badge (optional)

### Estimated Time
**45-60 minutes**

---

## ⚡ DECK-103: Quick Wins - UX Improvements

**Type:** Enhancement  
**Priority:** Medium  
**Story Points:** 3  
**Sprint:** Next  

### Description
Collection of small, high-impact improvements to enhance the deck builder user experience.

### Sub-Tasks

#### DECK-103a: Auto-Detect Deck Archetype
**Story Points:** 1  
**Time:** 10 minutes

**Acceptance Criteria:**
- [ ] Analyze selected 8 cards to determine archetype
- [ ] Logic: Check for win conditions, spell types, avg elixir
- [ ] Display badge near deck stats: "Cycle", "Beatdown", "Control", "Bait", etc.
- [ ] Update badge in real-time as cards are selected

**Technical Notes:**
```typescript
function detectArchetype(cards: CardData[]): string {
  const avgElixir = calculateAvgElixir(cards);
  const hasHogRider = cards.some(c => c.key === 'hog_rider');
  const hasTank = cards.some(c => ['golem', 'giant', 'pekka'].includes(c.key));
  
  if (avgElixir < 3.0) return 'Cycle';
  if (hasTank) return 'Beatdown';
  if (hasLogBait(cards)) return 'Log Bait';
  // ... more logic
  return 'Control';
}
```

---

#### DECK-103b: Card Search Bar
**Story Points:** 1  
**Time:** 10 minutes

**Acceptance Criteria:**
- [ ] Add search input above card grid
- [ ] Filter cards by name as user types
- [ ] Case-insensitive search
- [ ] Debounce input (300ms)
- [ ] Show "No cards found" message when search has no results
- [ ] Clear button to reset search

**UI Location:** Between category filters and card grid

---

#### DECK-103c: Recently Used Cards Section
**Story Points:** 1  
**Time:** 10 minutes

**Acceptance Criteria:**
- [ ] Track last 12 cards user has selected (localStorage)
- [ ] Show "Recently Used" section above card grid
- [ ] Horizontal scroll of recent cards
- [ ] Quick-add cards with single click
- [ ] Persist across sessions
- [ ] Clear button to reset history

**Technical Notes:**
```typescript
// localStorage key: 'decksy_recent_cards'
const addToRecent = (cardKey: string) => {
  const recent = getRecentCards();
  const updated = [cardKey, ...recent.filter(k => k !== cardKey)].slice(0, 12);
  localStorage.setItem('decksy_recent_cards', JSON.stringify(updated));
};
```

---

#### DECK-103d: Deck Export Options
**Story Points:** 1  
**Time:** 10 minutes

**Acceptance Criteria:**
- [ ] Add "Share" button next to "Save Deck"
- [ ] Export options dropdown:
  - [ ] Copy as text: "Hog Rider, Musketeer, Valkyrie, ..."
  - [ ] Copy as markdown: "## My Hog Cycle\n- Hog Rider\n..."
  - [ ] Copy deck link (if saved): "https://decksy.dev/deck/my-hog-cycle"
- [ ] Show toast notification: "Copied to clipboard!"
- [ ] Use Clipboard API with fallback

**Technical Notes:**
```typescript
const exportAsText = (cards: CardData[]) => {
  return cards.map(c => c.name).join(', ');
};

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
  showToast('Copied to clipboard!');
};
```

---

### Estimated Time
**Total: 30-40 minutes** (10 min each)

---

## 🚀 DECK-104: Advanced Features - Pro Tools

**Type:** Feature  
**Priority:** Low  
**Story Points:** 13  
**Sprint:** Backlog  

### Description
Advanced features for power users that add significant value but require more development time.

### Sub-Tasks

#### DECK-104a: Deck Comparison Tool
**Story Points:** 5  
**Time:** 60 minutes

**User Story:**
```
As a competitive player,
I want to compare my custom deck against meta decks,
So that I can see how my deck stacks up and identify gaps.
```

**Acceptance Criteria:**
- [ ] Add "Compare" button on saved deck card
- [ ] Modal showing side-by-side comparison
- [ ] Compare against:
  - [ ] Another user deck
  - [ ] Pre-built catalog deck
  - [ ] Meta deck from API
- [ ] Comparison metrics:
  - [ ] Card overlap (X cards in common)
  - [ ] Elixir cost difference
  - [ ] Win condition comparison
  - [ ] Spell comparison
  - [ ] Building comparison
- [ ] Visual diff: highlight unique cards in each deck
- [ ] AI insight: "Your deck is more defensive with..."

**UI Mockup:**
```
┌────────────────────────────────────────────┐
│  Compare Decks                          [×] │
├────────────────────────────────────────────┤
│  Your Deck          vs      Meta Hog Cycle │
│  ┌──────────┐            ┌──────────┐      │
│  │ 8 cards  │            │ 8 cards  │      │
│  └──────────┘            └──────────┘      │
│                                             │
│  Similarities: 5/8 cards match             │
│  Avg Elixir: 2.8 vs 2.9                    │
│                                             │
│  Unique to Your Deck:  Unique to Meta:     │
│  • Wizard              • Ice Golem         │
│  • Mini PEKKA          • Skeletons         │
│                                             │
│  💡 AI Insight: Your deck trades cycle     │
│     speed for more splash damage...        │
└────────────────────────────────────────────┘
```

---

#### DECK-104b: Upgrade Calculator
**Story Points:** 3  
**Time:** 45 minutes

**User Story:**
```
As a free-to-play player,
I want to know how much it costs to max out my deck,
So that I can plan my upgrade path.
```

**Acceptance Criteria:**
- [ ] Show upgrade cost badge on each card
- [ ] Calculate total gold needed to max deck
- [ ] Show number of cards needed for each rarity
- [ ] Display time estimate (based on chest cycle)
- [ ] Prioritize upgrades by importance
- [ ] Show "Most efficient upgrade" suggestion

**Technical Notes:**
- Requires card level data from player API
- Clash Royale upgrade costs:
  - Common: 5, 20, 50, 150, 400, 1000, 2000, 4000, 8000, 20000, 100000
  - Rare: 50, 150, 400, 1000, 2000, 4000, 8000, 20000, 50000, 100000
  - Epic: 400, 1000, 2000, 4000, 8000, 20000, 50000, 100000
  - Legendary: 5000, 20000, 50000, 100000
  - Champion: 10000, 30000, 60000

---

#### DECK-104c: Public Deck Sharing
**Story Points:** 5  
**Time:** 60 minutes

**User Story:**
```
As a content creator,
I want to share my custom decks with a public link,
So that my followers can view and copy my deck builds.
```

**Acceptance Criteria:**
- [ ] Add "Make Public" toggle on saved decks
- [ ] Generate public URL: `/deck/custom/<slug>`
- [ ] Public page shows:
  - [ ] Deck name & description
  - [ ] 8 cards with art
  - [ ] Creator name (optional)
  - [ ] AI analysis (if available)
  - [ ] Stats: views, copies
  - [ ] "Copy Deck" button
- [ ] Copy deck → saves to user's decks
- [ ] OG meta tags for social sharing
- [ ] Privacy: only public decks are viewable

**Security Considerations:**
- Rate limit public deck views
- Validate slug format
- Check isPublic flag before serving

---

#### DECK-104d: Community Deck Browser
**Story Points:** 8  
**Time:** 90 minutes

**User Story:**
```
As a new player,
I want to browse decks created by other players,
So that I can find inspiration and learn from the community.
```

**Acceptance Criteria:**
- [ ] Create `/decks/browse` page
- [ ] List all public decks from database
- [ ] Filters:
  - [ ] Trophy range
  - [ ] Archetype
  - [ ] Contains specific card
  - [ ] Most viewed/copied
- [ ] Sort options:
  - [ ] Newest
  - [ ] Most popular
  - [ ] Highest rated (future)
- [ ] Pagination (20 decks per page)
- [ ] Search by deck name or creator
- [ ] Quick "Copy to My Decks" button
- [ ] View count tracking
- [ ] Copy count tracking

**Technical Requirements:**
- New API endpoint: `GET /api/deck/custom/public`
- Query parameters: `archetype`, `trophyMin`, `trophyMax`, `sort`, `page`
- Database query optimization (add indexes)
- Cache public deck list (Redis, 5 min TTL)

**UI Components:**
```tsx
<BrowseDecksPage>
  <SearchBar />
  <FilterSidebar />
  <DeckGrid>
    <PublicDeckCard
      deck={deck}
      showCreator
      showStats
      onCopy={handleCopy}
    />
  </DeckGrid>
  <Pagination />
</BrowseDecksPage>
```

---

### Estimated Time
**Total: 4-5 hours**
- Deck Comparison: 60 min
- Upgrade Calculator: 45 min
- Public Sharing: 60 min
- Community Browser: 90 min

---

## 📋 Implementation Priority

### Sprint 1 (Immediate - ~2 hours)
1. ✅ Deploy current deck builder to production
2. 🎨 **DECK-101**: Polish AI Analysis Display (45 min)
3. 💾 **DECK-102**: Saved Decks Management Page (60 min)

### Sprint 2 (Quick Wins - ~45 minutes)
4. ⚡ **DECK-103a**: Auto-detect archetype (10 min)
5. ⚡ **DECK-103b**: Card search bar (10 min)
6. ⚡ **DECK-103c**: Recently used cards (10 min)
7. ⚡ **DECK-103d**: Deck export options (10 min)

### Sprint 3 (Advanced - Backlog)
8. 🚀 **DECK-104a**: Deck comparison tool
9. 🚀 **DECK-104b**: Upgrade calculator
10. 🚀 **DECK-104c**: Public deck sharing
11. 🚀 **DECK-104d**: Community deck browser

---

## 🎯 Success Metrics

### Key Performance Indicators
- **Engagement:** % of users who use deck builder vs pre-built decks
- **Retention:** Users with 3+ saved decks
- **Analysis Usage:** % of decks that get AI analysis
- **Community:** Public deck views and copies
- **Time to Value:** Minutes from sign-up to first saved deck

### Target Goals (3 months)
- 60% of active users try deck builder
- 30% save at least one custom deck
- 50% of saved decks get AI analysis
- 1000+ public decks shared
- Average 3.5 saved decks per active user

---

## 📝 Technical Debt & Considerations

### Performance
- [ ] Add Redis caching for AI analysis (avoid duplicate API calls)
- [ ] Optimize card image loading (lazy load off-screen cards)
- [ ] Add service worker for offline card browsing
- [ ] Database indexes for public deck queries

### Accessibility
- [ ] Keyboard navigation for card selection
- [ ] Screen reader labels for all interactive elements
- [ ] Focus management in modals
- [ ] High contrast mode support

### Testing
- [ ] Unit tests for archetype detection logic
- [ ] Integration tests for deck CRUD operations
- [ ] E2E tests for save/load flow
- [ ] Load testing for Gemini API rate limits

---

**Last Updated:** October 18, 2025  
**Status:** Ready for Sprint Planning  
**Total Estimated Effort:** ~8-10 hours across all tickets
