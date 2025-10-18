/**
 * Card Upgrade Calculator
 * Calculates upgrade costs for Clash Royale cards
 */

type Rarity = "common" | "rare" | "epic" | "legendary" | "champion";

interface CardData {
  key: string;
  name: string;
  rarity: Rarity;
  level?: number;
}

interface UpgradeCost {
  gold: number;
  cards: number;
}

interface DeckUpgradeAnalysis {
  totalGold: number;
  totalCards: Record<Rarity, number>;
  cardUpgrades: Array<{
    cardKey: string;
    cardName: string;
    rarity: Rarity;
    currentLevel: number;
    targetLevel: number;
    goldNeeded: number;
    cardsNeeded: number;
    priority: number;
  }>;
  estimatedDays: number;
  mostExpensiveCard: string;
  cheapestUpgrade: string;
}

// Clash Royale upgrade costs (gold per level)
const UPGRADE_COSTS: Record<Rarity, number[]> = {
  common: [5, 20, 50, 150, 400, 1000, 2000, 4000, 8000, 20000, 100000],
  rare: [50, 150, 400, 1000, 2000, 4000, 8000, 20000, 50000, 100000],
  epic: [400, 1000, 2000, 4000, 8000, 20000, 50000, 100000],
  legendary: [5000, 20000, 50000, 100000],
  champion: [10000, 30000, 60000],
};

// Cards needed per level
const CARDS_NEEDED: Record<Rarity, number[]> = {
  common: [2, 4, 10, 20, 50, 100, 200, 400, 800, 1000, 5000],
  rare: [2, 4, 10, 20, 50, 100, 200, 400, 800, 1000],
  epic: [2, 4, 10, 20, 50, 100, 200, 400],
  legendary: [2, 4, 10, 20],
  champion: [2, 5, 10],
};

// Max levels per rarity
const MAX_LEVELS: Record<Rarity, number> = {
  common: 14,
  rare: 12,
  epic: 10,
  legendary: 6,
  champion: 5,
};

/**
 * Calculate cost to upgrade a single card from current level to max
 */
export function calculateCardUpgradeCost(
  rarity: Rarity,
  currentLevel: number
): UpgradeCost {
  const maxLevel = MAX_LEVELS[rarity];
  const costs = UPGRADE_COSTS[rarity];
  const cardCounts = CARDS_NEEDED[rarity];

  if (currentLevel >= maxLevel) {
    return { gold: 0, cards: 0 };
  }

  let totalGold = 0;
  let totalCards = 0;

  // Sum costs from current level to max
  for (let i = currentLevel - 1; i < maxLevel - 1; i++) {
    totalGold += costs[i] || 0;
    totalCards += cardCounts[i] || 0;
  }

  return { gold: totalGold, cards: totalCards };
}

/**
 * Calculate upgrade priority based on card importance and efficiency
 */
function calculatePriority(
  card: CardData,
  currentLevel: number,
  upgradeCost: UpgradeCost
): number {
  let priority = 0;

  // Lower level cards get higher priority
  priority += (MAX_LEVELS[card.rarity] - currentLevel) * 2;

  // Lower cost upgrades get bonus priority
  if (upgradeCost.gold < 5000) priority += 10;
  else if (upgradeCost.gold < 20000) priority += 5;

  // Legendary and Champion cards get slight penalty (harder to obtain)
  if (card.rarity === "legendary") priority -= 5;
  if (card.rarity === "champion") priority -= 8;

  // Common cards get bonus (easier to upgrade)
  if (card.rarity === "common") priority += 5;

  return Math.max(0, priority);
}

/**
 * Analyze upgrade path for entire deck
 */
export function analyzeDeckUpgrades(cards: CardData[]): DeckUpgradeAnalysis {
  let totalGold = 0;
  const totalCards: Record<Rarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    champion: 0,
  };

  const cardUpgrades = cards.map(card => {
    const currentLevel = card.level || 1;
    const maxLevel = MAX_LEVELS[card.rarity];
    const cost = calculateCardUpgradeCost(card.rarity, currentLevel);

    totalGold += cost.gold;
    totalCards[card.rarity] += cost.cards;

    return {
      cardKey: card.key,
      cardName: card.name,
      rarity: card.rarity,
      currentLevel,
      targetLevel: maxLevel,
      goldNeeded: cost.gold,
      cardsNeeded: cost.cards,
      priority: calculatePriority(card, currentLevel, cost),
    };
  });

  // Sort by priority (highest first)
  cardUpgrades.sort((a, b) => b.priority - a.priority);

  // Find most expensive and cheapest upgrades
  const mostExpensiveCard = cardUpgrades.reduce((max, card) =>
    card.goldNeeded > max.goldNeeded ? card : max
  ).cardName;

  const cheapestUpgrade = cardUpgrades.reduce((min, card) =>
    card.goldNeeded > 0 && card.goldNeeded < min.goldNeeded ? card : min
  ).cardName;

  // Estimate days (assuming 3000 gold per day from various sources)
  const estimatedDays = Math.ceil(totalGold / 3000);

  return {
    totalGold,
    totalCards,
    cardUpgrades,
    estimatedDays,
    mostExpensiveCard,
    cheapestUpgrade,
  };
}

/**
 * Get upgrade recommendation
 */
export function getUpgradeRecommendation(analysis: DeckUpgradeAnalysis): string {
  const topPriority = analysis.cardUpgrades[0];
  
  if (!topPriority) {
    return "All cards are maxed out! 🎉";
  }

  if (topPriority.goldNeeded === 0) {
    return "All cards are maxed out! 🎉";
  }

  return `Start by upgrading ${topPriority.cardName} to level ${topPriority.targetLevel}. It's your most efficient upgrade path.`;
}

/**
 * Format gold amount with K/M suffixes
 */
export function formatGold(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

/**
 * Format time estimate
 */
export function formatTimeEstimate(days: number): string {
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}
