import { describe, expect, it } from "vitest";

import {
  battleLogSchema,
  coachResponseSchema,
  coachScoreSchema,
  deckScoreBreakdownSchema,
  feedbackRequestSchema,
  playerProfileSchema,
  recommendationPayloadSchema,
  recommendationResponseSchema,
} from "@/app/api/_schemas";
import { deckCatalog } from "@/lib/data/deck-catalog";

const samplePlayer = {
  tag: "ABC123",
  name: "Sample Player",
  trophies: 6400,
  arena: "Master I",
  collection: [
    { key: "mega_knight", level: 13 },
    { key: "miner", level: 13 },
  ],
};

const sampleQuiz = {
  preferredPace: "balanced" as const,
  comfortLevel: "cycle" as const,
  riskTolerance: "mid" as const,
};

describe("API schemas", () => {
  it("validates recommendation payloads and responses", () => {
    const payload = { player: samplePlayer, quiz: sampleQuiz };
    expect(() => recommendationPayloadSchema.parse(payload)).not.toThrow();

    const deck = deckCatalog[0];
    const response = {
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      results: [
        {
          deck,
          score: 92,
          breakdown: {
            collection: 88,
            trophies: 95,
            playstyle: 90,
            difficulty: 70,
          },
          notes: ["Consider practicing cycle timings."],
          explainer: {
            summary: "Test summary",
            substitutions: [{ card: "Zap", suggestion: "Arrows" }],
            matchupTips: [{ archetype: "Cycle", tip: "Hold Tesla for Hog pushes." }],
          },
        },
      ],
    };

    const parsed = recommendationResponseSchema.parse(response);
    expect(parsed.results[0].deck.slug).toEqual(deck.slug);
  });

  it("rejects invalid feedback and honeypot content", () => {
    const success = feedbackRequestSchema.safeParse({ sessionId: "abc", rating: 1, notes: "Great deck!", channel: "" });
    expect(success.success).toBe(true);

    const ratingFailure = feedbackRequestSchema.safeParse({ sessionId: "abc", rating: 5 });
    expect(ratingFailure.success).toBe(false);

    const honeypotFailure = feedbackRequestSchema.safeParse({ sessionId: "abc", rating: 1, channel: "spam" });
    expect(honeypotFailure.success).toBe(false);
  });

  it("describes coaching responses", () => {
    const deck = deckCatalog[1];
    const breakdown = deckScoreBreakdownSchema.parse({
      collection: 80,
      trophies: 85,
      playstyle: 78,
      difficulty: 72,
    });

    const score = coachScoreSchema.parse({
      total: 83,
      breakdown,
      notes: ["Tighten defense rotations."],
    });

    const response = coachResponseSchema.parse({ deck, score });
    expect(response.score?.total).toBe(83);
  });

  it("validates player profiles and battle logs", () => {
    const profile = playerProfileSchema.parse(samplePlayer);
    expect(profile.tag).toBe("ABC123");

    const battles = battleLogSchema.parse([
      {
        opponent: "Ladder Legend",
        result: "win" as const,
        deck: ["mega_knight", "miner"],
        timestamp: new Date().toISOString(),
      },
    ]);
    expect(battles).toHaveLength(1);
  });
});
