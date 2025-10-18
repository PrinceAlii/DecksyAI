import { deckCatalog } from "@/lib/data/deck-catalog";
import { cacheGet, cacheSet } from "@/lib/redis";
import { PlayerCollectionCard, PlayerProfile } from "@/lib/scoring";

interface ClashRoyalePlayerResponse {
  tag: string;
  name: string;
  trophies: number;
  bestTrophies?: number;
  currentArena?: { name: string; id?: number };
  arena?: { name: string; id?: number };
  currentPathOfLegendSeasonResult?: {
    leagueNumber?: number;
    trophies?: number;
    rank?: number;
  };
  cards: { name: string; id: number; level: number; maxLevel: number; key?: string }[];
}

const MOCK_COLLECTION: PlayerCollectionCard[] = [
  { key: "mega_knight", level: 13 },
  { key: "miner", level: 12 },
  { key: "wall_breakers", level: 13 },
  { key: "bats", level: 13 },
  { key: "inferno_dragon", level: 11 },
  { key: "musketeer", level: 13 },
  { key: "zap", level: 13 },
  { key: "snowball", level: 12 },
  { key: "royal_giant", level: 13 },
  { key: "fisherman", level: 11 },
  { key: "mother_witch", level: 12 },
  { key: "hunter", level: 13 },
  { key: "lightning", level: 12 },
  { key: "log", level: 13 },
  { key: "electro_spirit", level: 13 },
  { key: "royal_ghost", level: 12 },
];

// Normalise a human card name (e.g., "P.E.K.K.A", "The Log") into our snake_case key (e.g., "pekka", "log").
// - Lowercase
// - Strip diacritics
// - Remove punctuation except spaces/underscores
// - Collapse whitespace to single underscore
// Returns null if we can't derive a non-empty key
const toKey = (name?: string | null): string | null => {
  if (!name) return null;
  // Remove diacritics
  const withoutDiacritics = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  // Keep letters/numbers/space/underscore, then convert spaces to underscores
  const cleaned = withoutDiacritics
    .replace(/[^a-z0-9_\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
  return cleaned.length > 0 ? cleaned : null;
};

// Determine arena name based on trophy count
// Based on Clash Royale's current arena system (as of June 2025)
// Source: https://clashroyale.fandom.com/wiki/Arenas
// Note: The API may not always return arena names for high-trophy players,
// so we calculate based on trophy ranges as fallback
const getArenaName = (trophies: number): string => {
  // Seasonal Arenas (10,000+)
  if (trophies >= 15000) return "Seasonal Arena 5";
  if (trophies >= 13500) return "Seasonal Arena 4";
  if (trophies >= 12000) return "Seasonal Arena 3";
  if (trophies >= 11000) return "Seasonal Arena 2";
  if (trophies >= 10000) return "Seasonal Arena 1";
  
  // Regular Arenas
  if (trophies >= 9500) return "Legendary Arena";      // Arena 24
  if (trophies >= 9000) return "Valkalla";             // Arena 23
  if (trophies >= 8500) return "PANCAKES!";            // Arena 22
  if (trophies >= 8000) return "Clash Fest";           // Arena 21
  if (trophies >= 7500) return "Boot Camp";            // Arena 20
  if (trophies >= 7000) return "Dragon Spa";           // Arena 19
  if (trophies >= 6500) return "Silent Sanctuary";     // Arena 18
  if (trophies >= 6000) return "Royal Crypt";          // Arena 17
  if (trophies >= 5500) return "Executioner's Kitchen"; // Arena 16
  if (trophies >= 5000) return "Miner's Mine";         // Arena 15
  if (trophies >= 4600) return "Serenity Peak";        // Arena 14
  if (trophies >= 4200) return "Rascal's Hideout";     // Arena 13
  if (trophies >= 3800) return "Spooky Town";          // Arena 12
  if (trophies >= 3400) return "Electro Valley";       // Arena 11
  if (trophies >= 3000) return "Hog Mountain";         // Arena 10
  if (trophies >= 2600) return "Jungle Arena";         // Arena 9
  if (trophies >= 2300) return "Frozen Peak";          // Arena 8
  if (trophies >= 2000) return "Royal Arena";          // Arena 7
  if (trophies >= 1600) return "P.E.K.K.A's Playhouse"; // Arena 6
  if (trophies >= 1300) return "Builder's Workshop";   // Arena 5
  if (trophies >= 1000) return "Spell Valley";         // Arena 4
  if (trophies >= 600) return "Barbarian Bowl";        // Arena 3
  if (trophies >= 300) return "Bone Pit";              // Arena 2
  if (trophies >= 0) return "Goblin Stadium";          // Arena 1
  return "Training Camp";
};

export async function fetchPlayerProfile(tag: string): Promise<PlayerProfile> {
  const cacheKey = `player:${tag}`;
  const cached = await cacheGet<PlayerProfile>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.CLASH_ROYALE_API_KEY;
  const CLASH_API_BASE = process.env.CLASH_ROYALE_API_PROXY || "https://proxy.royaleapi.dev";
  const url = `${CLASH_API_BASE}/v1/players/%23${encodeURIComponent(tag.replace("#", ""))}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch player: ${response.status}`);
    }

    const data = (await response.json()) as ClashRoyalePlayerResponse;
    
    // Determine arena: prefer API-provided arena, fallback to trophy-based calculation
    const arenaName = 
      data.currentArena?.name || 
      data.arena?.name || 
      getArenaName(data.trophies);
    
    const profile: PlayerProfile = {
      tag: data.tag,
      name: data.name,
      trophies: data.trophies,
      arena: arenaName,
      collection: (data.cards ?? [])
        .flatMap((card) => {
          const key = card.key ?? toKey(card.name);
          if (!key) {
            // Drop unrecognisable entries to preserve data integrity
            console.warn("Skipping card with missing/invalid key in player collection:", {
              id: card.id,
              name: card.name,
            });
            return [] as PlayerCollectionCard[];
          }
          const level = typeof card.level === "number" && Number.isFinite(card.level) ? card.level : 0;
          return [{ key, level } satisfies PlayerCollectionCard];
        }),
    };

    await cacheSet(cacheKey, profile, 300);
    return profile;
  } catch (error) {
    console.warn(`Clash Royale API unavailable, returning mock data. Reason: ${String(error)}`);
    const profile: PlayerProfile = {
      tag,
      name: "Mock Player",
      trophies: 6200,
      arena: "Master I",
      collection: MOCK_COLLECTION,
    };
    await cacheSet(cacheKey, profile, 60);
    return profile;
  }
}

export type DeckArchetype = (typeof deckCatalog)[number]["archetype"];

export interface BattleLogEntry {
  opponent: string;
  result: "win" | "loss" | "draw";
  deck: string[];
  opponentDeck: string[];
  timestamp: string;
}

export interface BattleArchetypeAggregate {
  totalBattles: number;
  archetypeExposure: Partial<Record<DeckArchetype, number>>;
}

export async function fetchBattleLog(tag: string): Promise<BattleLogEntry[]> {
  const cacheKey = `battles:${tag}`;
  const cached = await cacheGet<BattleLogEntry[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.CLASH_ROYALE_API_KEY;
  const CLASH_API_BASE = process.env.CLASH_ROYALE_API_PROXY || "https://proxy.royaleapi.dev";
  const url = `${CLASH_API_BASE}/v1/players/%23${encodeURIComponent(tag.replace("#", ""))}/battlelog`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch battles: ${response.status}`);
    }

    const rawBattles = (await response.json()) as Array<{
      battleTime: string;
      teamCrowns?: number;
      opponentCrowns?: number;
      team?: Array<{
        name?: string;
        crowns?: number;
        crownsEarned?: number;
        cards?: Array<{ key?: string; name?: string }>;
        deck?: Array<{ key?: string; name?: string }>;
      }>;
      opponent?: Array<{
        name?: string;
        crowns?: number;
        crownsEarned?: number;
        cards?: Array<{ key?: string; name?: string }>;
        deck?: Array<{ key?: string; name?: string }>;
      }>;
      opponentTeam?: Array<{
        name?: string;
        crowns?: number;
        crownsEarned?: number;
        cards?: Array<{ key?: string; name?: string }>;
        deck?: Array<{ key?: string; name?: string }>;
      }>;
    }>;

    const resolveDeck = (player?: {
      cards?: Array<{ key?: string; name?: string }>;
      deck?: Array<{ key?: string; name?: string }>;
    }): string[] => {
      if (!player) return [];
      const sources = player.cards ?? player.deck ?? [];
      return sources
        .map((card) => card?.key || toKey(card?.name))
        .filter((key): key is string => Boolean(key));
    };

    const battleLog: BattleLogEntry[] = rawBattles.slice(0, 5).map((match) => {
      const teamEntry = match.team?.[0];
      const opponentEntry = match.opponent?.[0] ?? match.opponentTeam?.[0];

      const teamCrowns =
        typeof match.teamCrowns === "number"
          ? match.teamCrowns
          : teamEntry?.crowns ?? teamEntry?.crownsEarned ?? 0;
      const opponentCrowns =
        typeof match.opponentCrowns === "number"
          ? match.opponentCrowns
          : opponentEntry?.crowns ?? opponentEntry?.crownsEarned ?? 0;

      let result: BattleLogEntry["result"] = "draw";
      if (teamCrowns > opponentCrowns) {
        result = "win";
      } else if (teamCrowns < opponentCrowns) {
        result = "loss";
      }

      return {
        opponent: opponentEntry?.name ?? "Unknown",
        result,
        deck: resolveDeck(teamEntry),
        opponentDeck: resolveDeck(opponentEntry),
        timestamp: match.battleTime,
      };
    });

    await cacheSet(cacheKey, battleLog, 300);
    return battleLog;
  } catch (error) {
    console.warn(`Clash Royale battle log fallback. Reason: ${String(error)}`);
    const mock: BattleLogEntry[] = [
      {
        opponent: "Ladder Legend",
        result: "win",
        deck: ["mega_knight", "miner", "wall_breakers", "bats"],
        opponentDeck: ["royal_giant", "fisherman", "mother_witch", "hunter"],
        timestamp: new Date().toISOString(),
      },
      {
        opponent: "Spell Cycle",
        result: "loss",
        deck: ["x_bow", "tesla", "archers"],
        opponentDeck: ["hog_rider", "ice_golem", "musketeer", "cannon"],
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ];
    await cacheSet(cacheKey, mock, 120);
    return mock;
  }
}

const deckArchetypeIndex = deckCatalog.map((deck) => ({
  archetype: deck.archetype,
  cards: new Set(deck.cards.map((card) => card.key)),
}));

function inferArchetypeFromDeck(deckCards: string[]): DeckArchetype | null {
  if (deckCards.length === 0) {
    return null;
  }

  let bestMatch: { archetype: (typeof deckCatalog)[number]["archetype"]; score: number } | null = null;

  for (const entry of deckArchetypeIndex) {
    let matches = 0;
    for (const card of deckCards) {
      if (entry.cards.has(card)) {
        matches += 1;
      }
    }

    const score = matches / entry.cards.size;
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { archetype: entry.archetype, score };
    }
  }

  if (!bestMatch || bestMatch.score < 0.4) {
    return null;
  }

  return bestMatch.archetype;
}

export function aggregateBattleArchetypes(battles: BattleLogEntry[]): BattleArchetypeAggregate {
  const exposure: BattleArchetypeAggregate["archetypeExposure"] = {};

  for (const battle of battles) {
    const archetype = inferArchetypeFromDeck(battle.opponentDeck);
    if (!archetype) {
      continue;
    }

    exposure[archetype] = (exposure[archetype] ?? 0) + 1;
  }

  return {
    totalBattles: battles.length,
    archetypeExposure: exposure,
  };
}

export async function fetchBattleArchetypeAggregate(tag: string): Promise<BattleArchetypeAggregate> {
  const battles = await fetchBattleLog(tag);
  return aggregateBattleArchetypes(battles);
}
