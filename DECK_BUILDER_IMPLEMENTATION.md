# Deck Builder Implementation Plan

## ✅ What's Been Created

### 1. **Core Deck Builder Component** (`src/components/features/deck-builder/deck-builder.tsx`)
   - Interactive card grid with 100+ Clash Royale cards
   - Visual deck builder (8-card slots)
   - Category filtering (Win Conditions, Support, Spells, Buildings)
   - Real-time deck stats (average elixir)
   - Card selection/deselection
   - "Owned cards only" filter (ready for API integration)

### 2. **Deck Builder Page** (`src/app/deck-builder/page.tsx`)
   - Standalone page at `/deck-builder`
   - Beautiful UI matching Decksy design system
   - Save deck functionality (ready to integrate)

## 🎯 Key Features Implemented

### Like DeckShop.pro:
- ✅ **Card Grid Interface** - All cards organized by category
- ✅ **Visual Deck Building** - Drag-free click-to-add interface
- ✅ **Category Filters** - Win conditions, support, spells, buildings
- ✅ **Real-time Stats** - Average elixir calculation
- ✅ **Card Level Display** - Ready for player data integration
- ✅ **Ownership Filtering** - Show only cards the player owns

### Decksy-Specific Features:
- ✅ **Dark theme integration** - Matches existing design
- ✅ **Animated backgrounds** - Consistent with site aesthetic
- ✅ **AI suggestions placeholder** - Ready for Gemini integration

## 🚀 Integration Steps

### Step 1: Connect Player API
Update the deck builder to fetch player card collection:

```typescript
// In src/app/deck-builder/page.tsx
async function fetchPlayerCards(playerTag: string) {
  const response = await fetch(`/api/player?tag=${playerTag}`);
  const data = await response.json();
  
  // Map player cards to DeckBuilder format
  return data.cards.map(card => ({
    key: card.id,
    name: card.name,
    category: detectCategory(card),
    elixir: card.elixir,
    rarity: card.rarity,
    owned: true,
    level: card.level,
  }));
}
```

### Step 2: Create Deck Save API
Add a new API route to save custom decks:

```typescript
// src/app/api/deck/save/route.ts
export async function POST(req: Request) {
  const { playerTag, cards, name } = await req.json();
  
  // Save to database
  const deck = await prisma.customDeck.create({
    data: {
      playerTag,
      name,
      cards: JSON.stringify(cards),
      avgElixir: calculateAvgElixir(cards),
    },
  });
  
  return Response.json({ success: true, deckId: deck.id });
}
```

### Step 3: Add AI Analysis
Integrate Gemini to analyze custom decks:

```typescript
// When user clicks "Analyze Deck"
const analysis = await fetch('/api/coach/analyze', {
  method: 'POST',
  body: JSON.stringify({
    cards: selectedCards,
    playerTag: playerTag,
  }),
});

// Get AI feedback on:
// - Deck balance (win conditions, support, spells ratio)
// - Synergies between cards
// - Counters and weaknesses
// - Suggested substitutions
```

### Step 4: Add to Navigation
Update site header to include deck builder:

```tsx
// In src/components/ui/site-header.tsx
<Link href="/deck-builder" className="text-sm text-text-muted hover:text-text">
  Deck Builder
</Link>
```

## 🎨 Future Enhancements

### Phase 1 (Core Functionality)
- [ ] **Player Tag Input** - Let users enter tag to load their cards
- [ ] **Deck Saving** - Save custom decks to database
- [ ] **Deck History** - View previously built decks
- [ ] **Share Decks** - Generate shareable links

### Phase 2 (AI Features)
- [ ] **Smart Suggestions** - AI recommends cards based on current selection
- [ ] **Auto-Complete** - Generate full deck from partial selection
- [ ] **Deck Analysis** - Detailed breakdown of strengths/weaknesses
- [ ] **Meta Comparison** - Compare custom deck to meta decks

### Phase 3 (Advanced)
- [ ] **Card Synergy Highlighting** - Visual indicators for card combos
- [ ] **Evolution Card Support** - Special handling for evo cards
- [ ] **Deck Templates** - Start from popular archetypes
- [ ] **Copy Pro Decks** - Import decks from top players
- [ ] **Draft Mode** - Random card picker for practice

## 📊 Database Schema

Add a new table for custom decks:

```prisma
model CustomDeck {
  id          String   @id @default(cuid())
  playerTag   String
  name        String
  cards       Json     // Array of card objects
  avgElixir   Float
  archetype   String?  // Auto-detected or user-selected
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([playerTag])
}
```

## 🔗 API Endpoints Needed

### 1. Get Player Cards
```
GET /api/player?tag={PLAYER_TAG}
Returns: Player's card collection with levels
```

### 2. Save Custom Deck
```
POST /api/deck/save
Body: { playerTag, name, cards }
Returns: { deckId, shareUrl }
```

### 3. Analyze Deck
```
POST /api/coach/analyze
Body: { cards, playerTag }
Returns: { balance, synergies, counters, suggestions }
```

### 4. Get Saved Decks
```
GET /api/deck/list?playerTag={TAG}
Returns: Array of user's custom decks
```

## 🎯 Usage Examples

### Basic Usage
```tsx
<DeckBuilder />
```

### With Player Data
```tsx
<DeckBuilder 
  playerCards={playerCards}
  showOnlyOwned={true}
  onSaveDeck={(cards) => saveDeckToAPI(cards)}
/>
```

### With Callbacks
```tsx
<DeckBuilder 
  onSaveDeck={(cards) => {
    // Save to API
    saveDeck(cards);
    
    // Navigate to analysis
    router.push(`/deck/analyze?cards=${encodeCards(cards)}`);
  }}
/>
```

## 📱 Mobile Optimization

The deck builder is fully responsive:
- **Mobile**: 4-6 cards per row
- **Tablet**: 8 cards per row
- **Desktop**: 10 cards per row

Touch-friendly card selection with visual feedback.

## 🎨 Design Tokens Used

Follows existing Decksy design system:
- `bg-surface/80` - Card backgrounds
- `border-primary/60` - Selected card borders
- `text-text-muted` - Helper text
- `badge` components - Card stats
- Gradient backgrounds - Consistent with site

## 🚀 Quick Start

1. **Access the builder**: Navigate to `/deck-builder`
2. **Select cards**: Click any card to add it to your deck
3. **Filter cards**: Use category buttons to narrow down choices
4. **View stats**: See average elixir update in real-time
5. **Save deck**: Once you have 8 cards, click "Save Deck"

---

**Status**: ✅ Core functionality complete, ready for API integration
**Next Steps**: Add player tag input and connect to Clash Royale API
**Priority**: Medium-High (great for user engagement)

