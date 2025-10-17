import { prisma } from "@/lib/prisma";
import { getRecommendation } from "@/lib/recommendation-store";
import type {
  RecommendationDeckResult,
  RecommendationExplainer,
  RecommendationScoreBreakdown,
} from "@/lib/types/recommendation";

export interface LoadedRecommendation {
  sessionId: string;
  playerTag: string;
  trophyInfo: string;
  results: RecommendationDeckResult[];
  breakdown: RecommendationScoreBreakdown[];
  createdAt?: string;
  arena?: string;
}

function parseExplainer(value: unknown): RecommendationExplainer | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as {
    summary?: unknown;
    substitutions?: unknown;
    matchupTips?: unknown;
  };

  if (typeof record.summary !== "string") {
    return undefined;
  }

  const substitutions = Array.isArray(record.substitutions)
    ? record.substitutions
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const subRecord = item as { card?: unknown; suggestion?: unknown };
          if (typeof subRecord.card === "string" && typeof subRecord.suggestion === "string") {
            return { card: subRecord.card, suggestion: subRecord.suggestion };
          }
          return null;
        })
        .filter((entry): entry is { card: string; suggestion: string } => entry !== null)
    : [];

  const matchupTips = Array.isArray(record.matchupTips)
    ? record.matchupTips
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const tipRecord = item as { archetype?: unknown; tip?: unknown };
          if (typeof tipRecord.archetype === "string" && typeof tipRecord.tip === "string") {
            return { archetype: tipRecord.archetype, tip: tipRecord.tip };
          }
          return null;
        })
        .filter((entry): entry is { archetype: string; tip: string } => entry !== null)
    : [];

  return {
    summary: record.summary,
    substitutions,
    matchupTips,
  };
}

function parseDeckResults(value: unknown): RecommendationDeckResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const results: RecommendationDeckResult[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as RecommendationDeckResult & { explainer?: unknown };
    if (!record.deck || typeof record.deck !== "object" || typeof record.deck.slug !== "string") {
      continue;
    }

    const breakdown = record.breakdown ?? { collection: 0, trophies: 0, playstyle: 0, difficulty: 0 };
    const notes = Array.isArray(record.notes)
      ? record.notes.filter((note): note is string => typeof note === "string")
      : [];

    results.push({
      deck: record.deck,
      score: typeof record.score === "number" ? record.score : 0,
      breakdown: {
        collection: breakdown.collection ?? 0,
        trophies: breakdown.trophies ?? 0,
        playstyle: breakdown.playstyle ?? 0,
        difficulty: breakdown.difficulty ?? 0,
      },
      notes,
      explainer: parseExplainer(record.explainer),
    });
  }

  return results;
}

function parseScoreBreakdown(value: unknown): RecommendationScoreBreakdown[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as RecommendationScoreBreakdown;
      if (typeof record.deck !== "string" || typeof record.total !== "number") {
        return null;
      }

      return {
        deck: record.deck,
        total: record.total,
        breakdown: {
          collection: record.breakdown?.collection ?? 0,
          trophies: record.breakdown?.trophies ?? 0,
          playstyle: record.breakdown?.playstyle ?? 0,
          difficulty: record.breakdown?.difficulty ?? 0,
        },
        notes: Array.isArray(record.notes) ? record.notes.filter((note): note is string => typeof note === "string") : [],
      };
    })
    .filter((entry): entry is RecommendationScoreBreakdown => entry !== null);
}

export async function loadRecommendationBySession(sessionId: string): Promise<LoadedRecommendation | null> {
  if (!sessionId) {
    return null;
  }

  if (prisma) {
    const record = await prisma.recommendation.findUnique({ where: { sessionId } });
    if (record) {
      return {
        sessionId: record.sessionId,
        playerTag: record.playerTag,
        trophyInfo: record.arena ?? record.trophyRange ?? "Arena",
        results: parseDeckResults(record.decks),
        breakdown: parseScoreBreakdown(record.scoreBreakdown),
        createdAt: record.createdAt.toISOString(),
        arena: record.arena ?? undefined,
      };
    }
  }

  const stored = getRecommendation(sessionId);
  if (!stored) {
    return null;
  }

  return {
    sessionId: stored.sessionId,
    playerTag: stored.player.tag,
    trophyInfo: stored.player.arena ?? `${stored.player.trophies} trophies`,
    results: parseDeckResults(stored.decks),
    breakdown: parseScoreBreakdown(stored.scoreBreakdown),
  };
}
