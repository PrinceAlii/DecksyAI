import type { DeckDefinition } from "@/lib/data/deck-catalog";
import type { DeckScore, PlayerProfile, QuizResponse } from "@/lib/scoring";

export interface StoredRecommendation {
  sessionId: string;
  player: PlayerProfile;
  quiz: QuizResponse;
  scoreBreakdown: {
    deck: string;
    total: number;
    breakdown: DeckScore["breakdown"];
    notes: string[];
  }[];
  decks: {
    deck: DeckDefinition;
    score: number;
    breakdown: DeckScore["breakdown"];
    notes: string[];
    explainer?: unknown;
  }[];
  profileSignature: string;
}

interface RecommendationEntry {
  record: StoredRecommendation;
  expiresAt: number;
}

const store = new Map<string, RecommendationEntry>();
const IN_MEMORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

const TROPHY_BAND_SIZE = 200;

function sanitiseTag(tag: string): string {
  const cleaned = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return cleaned.length > 0 ? cleaned : "unknown";
}

function deriveTrophyBand(trophies: number | null | undefined): string {
  if (typeof trophies !== "number" || Number.isNaN(trophies)) {
    return "unknown";
  }

  const bandStart = Math.floor(Math.max(trophies, 0) / TROPHY_BAND_SIZE) * TROPHY_BAND_SIZE;
  const bandEnd = bandStart + (TROPHY_BAND_SIZE - 1);
  return `${bandStart}-${bandEnd}`;
}

function deriveCollectionReadiness(collection: PlayerProfile["collection"]): string {
  if (!Array.isArray(collection) || collection.length === 0) {
    return "empty";
  }

  return collection
    .map((card) => `${card.key}:${Math.max(0, card.level)}`)
    .sort()
    .join("|");
}

export function buildPlayerProfileSignature(player: PlayerProfile): string {
  const trophyBand = deriveTrophyBand(player.trophies);
  const readiness = deriveCollectionReadiness(player.collection);
  return [sanitiseTag(player.tag), trophyBand, readiness].join(":");
}

export function hasProfileDrift(record: StoredRecommendation, player: PlayerProfile): boolean {
  return record.profileSignature !== buildPlayerProfileSignature(player);
}

function now(): number {
  return Date.now();
}

function purgeExpiredEntries(): void {
  const currentTime = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= currentTime) {
      store.delete(key);
    }
  }
}

export function saveRecommendation(record: Omit<StoredRecommendation, "profileSignature">) {
  const signature = buildPlayerProfileSignature(record.player);
  store.set(record.sessionId, {
    record: { ...record, profileSignature: signature },
    expiresAt: now() + IN_MEMORY_TTL_MS,
  });
}

export function getRecommendation(sessionId: string): StoredRecommendation | undefined {
  purgeExpiredEntries();
  const entry = store.get(sessionId);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= now()) {
    store.delete(sessionId);
    return undefined;
  }

  return entry.record;
}

export function listRecommendations(): StoredRecommendation[] {
  purgeExpiredEntries();
  return Array.from(store.values())
    .map((entry) => entry.record)
    .sort((a, b) => (a.sessionId > b.sessionId ? -1 : 1));
}

export function __resetRecommendationStoreForTests() {
  store.clear();
}
