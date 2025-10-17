import { beforeEach, describe, expect, it } from "vitest";

import type { BattleArchetypeAggregate } from "@/lib/clash-royale";
import { deckCatalog } from "@/lib/data/deck-catalog";
import { getAnalyticsBuffer, resetAnalyticsBuffer } from "@/lib/analytics";
import {
  rankDecks,
  RecommendationPayload,
  resolveWeightStrategy,
  FeedbackPreferences,
} from "@/lib/scoring";

const mockPlayer = {
  tag: "#AAA111",
  name: "Tester",
  trophies: 6200,
  arena: "Master I",
  collection: deckCatalog[0].cards.map((card) => ({ key: card.key, level: card.levelRequirement })),
};

const mockQuiz = {
  preferredPace: "balanced" as const,
  comfortLevel: "bridge" as const,
  riskTolerance: "mid" as const,
};

describe("scoring weight adjustments", () => {
  beforeEach(() => {
    resetAnalyticsBuffer();
  });

  const basePayload: RecommendationPayload = {
    player: mockPlayer,
    quiz: mockQuiz,
    weightVariantOverride: "control",
  };

  it("applies feedback preference weight overrides", () => {
    const defaultStrategy = resolveWeightStrategy(basePayload);
    expect(defaultStrategy.weights.collection).toBeCloseTo(0.4, 2);
    expect(defaultStrategy.weights.playstyle).toBeCloseTo(0.3, 2);

    const feedbackPreferences: FeedbackPreferences = {
      collectionWeight: 0.2,
      playstyleWeight: 0.5,
      trophiesWeight: 0.2,
      difficultyWeight: 0.1,
      preferArchetypes: ["beatdown"],
    };

    const preferenceStrategy = resolveWeightStrategy({
      ...basePayload,
      feedbackPreferences,
    });

    expect(preferenceStrategy.weights.playstyle).toBeGreaterThan(defaultStrategy.weights.playstyle);
    expect(preferenceStrategy.weights.collection).toBeLessThan(defaultStrategy.weights.collection);
  });

  it("boosts control-focused weights when beatdown exposure is high", () => {
    const aggregate: BattleArchetypeAggregate = {
      totalBattles: 5,
      archetypeExposure: {
        beatdown: 4,
      },
    };

    const strategy = resolveWeightStrategy({
      ...basePayload,
      battleAggregate: aggregate,
    });

    expect(strategy.weights.playstyle).toBeGreaterThan(0.3);
    expect(strategy.weights.difficulty).toBeGreaterThan(0.1);
  });

  it("emits analytics when alternate weight variant is active", () => {
    const payload: RecommendationPayload = {
      ...basePayload,
      weightVariantOverride: "meta-aware",
      battleAggregate: {
        totalBattles: 6,
        archetypeExposure: { beatdown: 3, control: 2 },
      },
      feedbackPreferences: {
        preferArchetypes: ["control"],
      },
    };

    const decks = deckCatalog.slice(0, 3);
    const scores = rankDecks(decks, payload);

    expect(scores[0].deck.archetype).toBeDefined();
    expect(scores[0].notes.some((note) => note.includes("meta-aware"))).toBe(true);

    const events = getAnalyticsBuffer();
    const assignment = events.find((event) => event.name === "experiment_assignment");
    const exposure = events.find((event) => event.name === "experiment_exposure");

    expect(assignment).toBeDefined();
    expect(exposure).toBeDefined();
    expect(exposure?.properties?.variant).toBe("meta-aware");
  });
});
