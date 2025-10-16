import { describe, expect, it } from "vitest";

import { deckCatalog } from "@/lib/data/deck-catalog";
import { buildPrompt, parseGeminiPayload } from "@/lib/gemini";
import type { DeckScore, PlayerProfile } from "@/lib/scoring";

const sampleDeck = deckCatalog[0];

const sampleScore: DeckScore = {
  deck: sampleDeck,
  score: 82,
  breakdown: {
    collection: 78,
    trophies: 70,
    playstyle: 88,
    difficulty: 40,
  },
  notes: [],
};

const samplePlayer: PlayerProfile = {
  tag: "#AAAAAAA",
  name: "PlayerOne",
  trophies: 6300,
  arena: "Champions League",
  collection: [],
};

describe("buildPrompt", () => {
  it("excludes player names and provides structured guidance", () => {
    const prompt = buildPrompt(sampleDeck, sampleScore, samplePlayer);

    expect(prompt).toContain("You are Decksy AI");
    expect(prompt).toContain("two short paragraphs");
    expect(prompt).toContain("without mentioning any player names");
    expect(prompt).not.toContain(samplePlayer.name);
  });
});

describe("parseGeminiPayload", () => {
  it("parses valid JSON wrapped in code fences", () => {
    const payload = parseGeminiPayload(
      "```json\n{\"summary\":\"ok\",\"substitutions\":[{\"card\":\"Knight\",\"suggestion\":\"Upgrade\"}],\"matchupTips\":[{\"archetype\":\"Cycle\",\"tip\":\"Control bridge spam\"}]}\n```",
    );

    expect(payload).toEqual({
      summary: "ok",
      substitutions: [{ card: "Knight", suggestion: "Upgrade" }],
      matchupTips: [{ archetype: "Cycle", tip: "Control bridge spam" }],
    });
  });

  it("returns null for invalid payloads", () => {
    expect(parseGeminiPayload("not json")).toBeNull();
  });
});
