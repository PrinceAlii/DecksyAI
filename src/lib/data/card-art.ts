import type { DeckCard } from "./deck-catalog";

export const CARD_ART_BASE_URL = "https://royaleapi.github.io/cr-api-assets/cards-256/";
export const CARD_ART_FALLBACK = "/cards/fallback.svg";
export const CARD_ART_PLACEHOLDER = "/cards/placeholder.svg";

export const CARD_ART_OVERRIDES: Record<string, string> = {
  log: "the-log",
  snowball: "giant-snowball",
  electro_spirit: "electro-spirit",
  ice_spirit: "ice-spirit",
  fire_spirit: "fire-spirit",
  heal_spirit: "heal-spirit",
  goblin_drill: "goblin-drill",
  goblin_giant: "goblin-giant",
  inferno_dragon: "inferno-dragon",
  inferno_tower: "inferno-tower",
  giant_skeleton: "giant-skeleton",
  royal_ghost: "royal-ghost",
  royal_hogs: "royal-hogs",
  royal_recruits: "royal-recruits",
  mega_knight: "mega-knight",
  battle_ram: "battle-ram",
  barbarian_barrel: "barbarian-barrel",
  dark_prince: "dark-prince",
  night_witch: "night-witch",
  mother_witch: "mother-witch",
  three_musketeers: "three-musketeers",
  golden_knight: "golden-knight",
  mighty_miner: "mighty-miner",
  skeleton_king: "skeleton-king",
  archer_queen: "archer-queen",
  electro_giant: "electro-giant",
  electro_dragon: "electro-dragon",
  battle_healer: "battle-healer",
};

export function resolveCardArtSlug(cardKey: string): string {
  return CARD_ART_OVERRIDES[cardKey] ?? cardKey.replace(/_/g, "-");
}

/**
 * Get card art URL - uses external CDN by default for reliability
 */
export function getCardArtUrl(card: Pick<DeckCard, "key" | "image">): string {
  // If card has explicit image path, use it
  if (card.image) {
    return card.image;
  }

  // Use external CDN (royaleapi.github.io) for all cards
  const slug = resolveCardArtSlug(card.key);
  return `${CARD_ART_BASE_URL}${slug}.png`;
}

/**
 * Get external CDN URL as fallback
 * @deprecated Use getCardArtUrl instead - it now uses CDN by default
 */
export function getExternalCardArtUrl(card: Pick<DeckCard, "key">): string {
  const slug = resolveCardArtSlug(card.key);
  return `${CARD_ART_BASE_URL}${slug}.png`;
}
