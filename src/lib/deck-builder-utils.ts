/**
 * Deck Builder Utilities
 * Helper functions for archetype detection, recent cards, and export
 */

interface CardData {
  key: string;
  name: string;
  category: "win-condition" | "support" | "spell" | "building";
  elixir: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
}

/**
 * DECK-103a: Detect deck archetype based on card composition
 */
export function detectDeckArchetype(cards: CardData[]): string {
  if (cards.length < 8) return "";

  const avgElixir = cards.reduce((sum, c) => sum + c.elixir, 0) / cards.length;
  const cardKeys = cards.map(c => c.key);
  const categories = cards.map(c => c.category);

  // Cycle decks (low elixir, fast cards)
  if (avgElixir < 3.0) {
    const hasHogOrMiner = cardKeys.some(k => ["hog_rider", "miner"].includes(k));
    if (hasHogOrMiner) return "Cycle";
  }

  // Beatdown (heavy tanks)
  const beatdownTanks = ["golem", "giant", "royal_giant", "electro_giant", "lava_hound", "pekka"];
  if (cardKeys.some(k => beatdownTanks.includes(k))) {
    return "Beatdown";
  }

  // Log Bait
  const baitCards = ["goblin_barrel", "princess", "goblin_gang", "skeleton_army"];
  const baitCount = cardKeys.filter(k => baitCards.includes(k)).length;
  if (baitCount >= 2 && cardKeys.includes("goblin_barrel")) {
    return "Log Bait";
  }

  // Bridge Spam
  const bridgeSpamCards = ["battle_ram", "ram_rider", "bandit", "royal_ghost", "dark_prince"];
  const bridgeSpamCount = cardKeys.filter(k => bridgeSpamCards.includes(k)).length;
  if (bridgeSpamCount >= 2) {
    return "Bridge Spam";
  }

  // Siege (X-Bow or Mortar)
  if (cardKeys.some(k => ["x_bow", "mortar"].includes(k))) {
    return "Siege";
  }

  // Graveyard decks
  if (cardKeys.includes("graveyard")) {
    return "Graveyard";
  }

  // Miner control/chip
  if (cardKeys.includes("miner") && avgElixir < 3.5) {
    return "Miner Control";
  }

  // Spell count for spell cycle
  const spellCount = categories.filter(c => c === "spell").length;
  if (spellCount >= 4) {
    return "Spell Cycle";
  }

  // Default to control if we can't determine
  return "Control";
}

/**
 * Get archetype color for badge styling
 */
export function getArchetypeColor(archetype: string): string {
  const colorMap: Record<string, string> = {
    "Cycle": "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    "Beatdown": "text-red-400 bg-red-400/10 border-red-400/30",
    "Log Bait": "text-purple-400 bg-purple-400/10 border-purple-400/30",
    "Bridge Spam": "text-orange-400 bg-orange-400/10 border-orange-400/30",
    "Siege": "text-blue-400 bg-blue-400/10 border-blue-400/30",
    "Graveyard": "text-green-400 bg-green-400/10 border-green-400/30",
    "Miner Control": "text-teal-400 bg-teal-400/10 border-teal-400/30",
    "Spell Cycle": "text-pink-400 bg-pink-400/10 border-pink-400/30",
    "Control": "text-text-muted bg-surface-muted border-border",
  };
  return colorMap[archetype] || colorMap["Control"];
}

/**
 * DECK-103c: Recent cards management (localStorage)
 */
const RECENT_CARDS_KEY = "decksy_recent_cards";
const MAX_RECENT_CARDS = 12;

export function getRecentCards(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_CARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToRecentCards(cardKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentCards();
    // Remove if already exists, then add to front
    const updated = [cardKey, ...recent.filter(k => k !== cardKey)].slice(0, MAX_RECENT_CARDS);
    localStorage.setItem(RECENT_CARDS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save recent cards:", err);
  }
}

export function clearRecentCards(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_CARDS_KEY);
  } catch (err) {
    console.error("Failed to clear recent cards:", err);
  }
}

/**
 * DECK-103d: Deck export utilities
 */
export function exportDeckAsText(cards: CardData[]): string {
  return cards.map(c => c.name).join(", ");
}

export function exportDeckAsMarkdown(cards: CardData[], deckName?: string): string {
  const title = deckName ? `## ${deckName}\n\n` : "";
  const cardList = cards.map(c => `- ${c.name} (${c.elixir} elixir)`).join("\n");
  const avgElixir = (cards.reduce((sum, c) => sum + c.elixir, 0) / cards.length).toFixed(1);
  const stats = `\n\n**Average Elixir:** ${avgElixir}`;
  return title + cardList + stats;
}

export function getDeckShareUrl(slug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/deck/recommended/${slug}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
