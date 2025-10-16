import { cacheGet, cacheSet } from "@/lib/redis";
import { PlayerCollectionCard, PlayerProfile } from "@/lib/scoring";

interface ClashRoyalePlayerResponse {
  tag: string;
  name: string;
  trophies: number;
  currentArena: { name: string };
  cards: { name: string; id: number; level: number; maxLevel: number; key: string }[];
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
    const profile: PlayerProfile = {
      tag: data.tag,
      name: data.name,
      trophies: data.trophies,
      arena: data.currentArena?.name ?? "Unknown Arena",
      collection: data.cards.map((card) => ({ key: card.key, level: card.level })),
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

export interface BattleLogEntry {
  opponent: string;
  result: "win" | "loss" | "draw";
  deck: string[];
  timestamp: string;
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
      opponent?: Array<{ name?: string; crowns?: number; crownsEarned?: number }>;
      opponentTeam?: Array<{ name?: string; crowns?: number; crownsEarned?: number }>;
    }>;

    const resolveDeck = (player?: {
      cards?: Array<{ key?: string; name?: string }>;
      deck?: Array<{ key?: string; name?: string }>;
    }): string[] => {
      if (!player) return [];
      const sources = player.cards ?? player.deck ?? [];
      return sources
        .map((card) => card?.key || (card?.name ? card.name.toLowerCase().replace(/\s+/g, "_") : null))
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
        timestamp: new Date().toISOString(),
      },
      {
        opponent: "Spell Cycle",
        result: "loss",
        deck: ["x_bow", "tesla", "archers"],
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ];
    await cacheSet(cacheKey, mock, 120);
    return mock;
  }
}
