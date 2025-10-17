import { beforeEach, describe, expect, it } from "vitest";

import { deckCatalog } from "@/lib/data/deck-catalog";
import {
  __resetRecommendationStoreForTests,
  buildPlayerProfileSignature,
  getRecommendation,
  hasProfileDrift,
  saveRecommendation,
} from "@/lib/recommendation-store";
import type { PlayerProfile, QuizResponse } from "@/lib/scoring";

const sampleDeck = deckCatalog[0];

const samplePlayer: PlayerProfile = {
  tag: "#AAA1111",
  name: "Sample",
  trophies: 4321,
  arena: "Path of Legends",
  collection: [
    { key: "archers", level: 12 },
    { key: "fire_spirits", level: 11 },
  ],
};

const sampleBreakdown = {
  collection: 70,
  trophies: 65,
  playstyle: 60,
  difficulty: 55,
} as const;

const sampleQuiz: QuizResponse = {
  preferredPace: "balanced",
  comfortLevel: "cycle",
  riskTolerance: "mid",
};

describe("buildPlayerProfileSignature", () => {
  it("changes when the player shifts trophy bands", () => {
    const baseline = buildPlayerProfileSignature(samplePlayer);
    const moved = buildPlayerProfileSignature({ ...samplePlayer, trophies: samplePlayer.trophies + 600 });

    expect(baseline).not.toEqual(moved);
  });

  it("changes when collection readiness drifts", () => {
    const baseline = buildPlayerProfileSignature(samplePlayer);
    const updated = buildPlayerProfileSignature({
      ...samplePlayer,
      collection: [...samplePlayer.collection.slice(0, 1), { key: "archers", level: 10 }],
    });

    expect(baseline).not.toEqual(updated);
  });
});

describe("hasProfileDrift", () => {
  beforeEach(() => {
    __resetRecommendationStoreForTests();
  });

  it("detects when stored recommendations no longer match the current profile", () => {
    saveRecommendation({
      sessionId: "session-123",
      player: samplePlayer,
      quiz: sampleQuiz,
      scoreBreakdown: [
        {
          deck: sampleDeck.slug,
          total: 82,
          breakdown: sampleBreakdown,
          notes: ["Solid option"],
        },
      ],
      decks: [
        {
          deck: sampleDeck,
          score: 82,
          breakdown: sampleBreakdown,
          notes: ["Solid option"],
        },
      ],
    });

    const stored = getRecommendation("session-123");
    expect(stored).toBeDefined();
    if (!stored) return;

    expect(hasProfileDrift(stored, samplePlayer)).toBe(false);
    expect(hasProfileDrift(stored, { ...samplePlayer, trophies: samplePlayer.trophies + 500 })).toBe(true);
  });
});
