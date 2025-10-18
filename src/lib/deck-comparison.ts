/**
 * Deck Comparison Utilities
 * Functions for comparing two decks and analyzing differences
 */

interface CardData {
  key: string;
  name: string;
  category: "win-condition" | "support" | "spell" | "building";
  elixir: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
}

interface DeckComparison {
  deck1Cards: CardData[];
  deck2Cards: CardData[];
  commonCards: CardData[];
  uniqueToDeck1: CardData[];
  uniqueToDeck2: CardData[];
  metrics: {
    cardOverlap: number;
    elixirDiff: number;
    deck1AvgElixir: number;
    deck2AvgElixir: number;
    winConditionComparison: string;
    spellComparison: string;
    buildingComparison: string;
  };
  insight: string;
}

/**
 * Compare two decks and return detailed analysis
 */
export function compareDecks(
  deck1Cards: string[],
  deck2Cards: string[],
  allCards: CardData[]
): DeckComparison {
  // Get full card data
  const deck1Full = deck1Cards.map(key => allCards.find(c => c.key === key)!).filter(Boolean);
  const deck2Full = deck2Cards.map(key => allCards.find(c => c.key === key)!).filter(Boolean);

  // Find common and unique cards
  const commonCards = deck1Full.filter(card =>
    deck2Cards.includes(card.key)
  );

  const uniqueToDeck1 = deck1Full.filter(card =>
    !deck2Cards.includes(card.key)
  );

  const uniqueToDeck2 = deck2Full.filter(card =>
    !deck1Cards.includes(card.key)
  );

  // Calculate metrics
  const deck1AvgElixir = deck1Full.reduce((sum, c) => sum + c.elixir, 0) / deck1Full.length;
  const deck2AvgElixir = deck2Full.reduce((sum, c) => sum + c.elixir, 0) / deck2Full.length;
  const elixirDiff = deck1AvgElixir - deck2AvgElixir;
  const cardOverlap = commonCards.length;

  // Analyze card types
  const winConditionComparison = compareCardType(deck1Full, deck2Full, "win-condition");
  const spellComparison = compareCardType(deck1Full, deck2Full, "spell");
  const buildingComparison = compareCardType(deck1Full, deck2Full, "building");

  // Generate AI insight
  const insight = generateComparisonInsight(
    deck1Full,
    deck2Full,
    uniqueToDeck1,
    uniqueToDeck2,
    elixirDiff
  );

  return {
    deck1Cards: deck1Full,
    deck2Cards: deck2Full,
    commonCards,
    uniqueToDeck1,
    uniqueToDeck2,
    metrics: {
      cardOverlap,
      elixirDiff,
      deck1AvgElixir,
      deck2AvgElixir,
      winConditionComparison,
      spellComparison,
      buildingComparison,
    },
    insight,
  };
}

function compareCardType(
  deck1: CardData[],
  deck2: CardData[],
  category: CardData["category"]
): string {
  const deck1Count = deck1.filter(c => c.category === category).length;
  const deck2Count = deck2.filter(c => c.category === category).length;

  if (deck1Count === deck2Count) {
    return `Both decks have ${deck1Count} ${category}${deck1Count !== 1 ? 's' : ''}`;
  } else if (deck1Count > deck2Count) {
    return `Your deck has ${deck1Count} vs ${deck2Count} (more ${category}s)`;
  } else {
    return `Your deck has ${deck1Count} vs ${deck2Count} (fewer ${category}s)`;
  }
}

function generateComparisonInsight(
  deck1: CardData[],
  deck2: CardData[],
  uniqueToDeck1: CardData[],
  uniqueToDeck2: CardData[],
  elixirDiff: number
): string {
  const insights: string[] = [];

  // Elixir comparison
  if (Math.abs(elixirDiff) > 0.3) {
    if (elixirDiff > 0) {
      insights.push("Your deck is heavier and likely focuses on stronger pushes");
    } else {
      insights.push("Your deck is faster and emphasizes cycle speed");
    }
  }

  // Win condition analysis
  const deck1WinCons = deck1.filter(c => c.category === "win-condition");
  const deck2WinCons = deck2.filter(c => c.category === "win-condition");
  
  if (deck1WinCons.length > deck2WinCons.length) {
    insights.push("with multiple win conditions for versatility");
  } else if (deck1WinCons.length < deck2WinCons.length) {
    insights.push("with a more focused win condition strategy");
  }

  // Spell analysis
  const deck1Spells = deck1.filter(c => c.category === "spell");
  const deck2Spells = deck2.filter(c => c.category === "spell");
  
  if (deck1Spells.length > deck2Spells.length) {
    insights.push("Your deck trades troops for more spell versatility");
  } else if (deck1Spells.length < deck2Spells.length) {
    insights.push("Your deck relies more on troops than spells");
  }

  // Building analysis
  const deck1Buildings = deck1.filter(c => c.category === "building");
  const deck2Buildings = deck2.filter(c => c.category === "building");
  
  if (deck1Buildings.length > deck2Buildings.length) {
    insights.push("with stronger defensive structures");
  } else if (deck1Buildings.length < deck2Buildings.length && deck2Buildings.length > 0) {
    insights.push("favoring mobile defense over buildings");
  }

  // Support card analysis
  const deck1Support = deck1.filter(c => c.category === "support");
  const deck2Support = deck2.filter(c => c.category === "support");
  
  if (deck1Support.length > deck2Support.length) {
    insights.push("Your deck has more support cards for defensive flexibility");
  }

  return insights.length > 0
    ? insights.join(", ") + "."
    : "Both decks have similar strategic approaches.";
}

/**
 * Get suggested comparison targets for a deck
 */
export function getSuggestedComparisons(
  currentDeckCards: string[],
  allDecks: Array<{ id: string; name: string; cards: string[]; slug: string }>
): Array<{ id: string; name: string; matchScore: number; slug: string }> {
  return allDecks
    .map(deck => {
      const overlap = currentDeckCards.filter(card => 
        deck.cards.includes(card)
      ).length;
      const matchScore = (overlap / 8) * 100;
      
      return {
        id: deck.id,
        name: deck.name,
        matchScore,
        slug: deck.slug,
      };
    })
    .filter(deck => deck.matchScore > 0 && deck.matchScore < 100) // Not identical, but has some overlap
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}
