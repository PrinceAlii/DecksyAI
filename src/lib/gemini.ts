import { GoogleGenerativeAI } from "@google/generative-ai";

import { getServerEnv, isDevelopment } from "@/lib/env";
import { DeckDefinition } from "@/lib/data/deck-catalog";
import { DeckScore, PlayerProfile } from "@/lib/scoring";

interface GeminiExplainer {
  summary: string;
  substitutions: { card: string; suggestion: string }[];
  matchupTips: { archetype: string; tip: string }[];
}

function buildPrompt(deck: DeckDefinition, score: DeckScore, player: PlayerProfile): string {
  return `You are Decksy AI. Explain why the deck ${deck.name} fits player ${player.name} (${player.trophies} trophies, arena ${player.arena}).` +
    ` Cards: ${deck.cards.map((card) => card.name).join(", ")}.` +
    ` Score breakdown: collection ${score.breakdown.collection}, trophies ${score.breakdown.trophies}, playstyle ${score.breakdown.playstyle}, difficulty ${score.breakdown.difficulty}.` +
    ` Provide summary, up to 3 substitution suggestions, and matchup tips for common archetypes.`;
}

function fallbackExplainer(deck: DeckDefinition, score: DeckScore, player: PlayerProfile): GeminiExplainer {
  return {
    summary: `${deck.name} leans into your ${score.breakdown.playstyle >= 60 ? "preferred" : "developing"} playstyle and keeps elixir cost at ${deck.averageElixir}. Use counterpush opportunities from your defensive wins.`,
    substitutions: deck.cards.slice(0, 2).map((card) => ({
      card: card.name,
      suggestion: `Swap with a similarly costed ${card.name} alternative if levels are low.`,
    })),
    matchupTips: [
      { archetype: "Beatdown", tip: "Punish heavy tanks by splitting pressure once they drop Golem/Giant." },
      { archetype: "Cycle", tip: "Keep spell value high and hold your best counter for their win condition." },
    ],
  };
}

export async function generateExplainer(deck: DeckDefinition, score: DeckScore, player: PlayerProfile): Promise<GeminiExplainer> {
  const env = getServerEnv();

  if (!env.GEMINI_API_KEY) {
    if (isDevelopment()) {
      console.warn("GEMINI_API_KEY missing. Using fallback explainer.");
    }
    return fallbackExplainer(deck, score, player);
  }

  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = buildPrompt(deck, score, player);
    const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = response.response.text();

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    const summary = lines[0] ?? `Play ${deck.name} with confidence.`;
    const substitutions = lines
      .filter((line) => line.toLowerCase().includes("substitute"))
      .slice(0, 3)
      .map((line) => ({
        card: deck.cards.find((card) => line.toLowerCase().includes(card.name.toLowerCase()))?.name ?? deck.cards[0].name,
        suggestion: line,
      }));

    const matchupTips = lines
      .filter((line) => line.toLowerCase().includes("matchup") || line.toLowerCase().includes("against"))
      .slice(0, 3)
      .map((line) => ({
        archetype: line.split(":")[0] ?? "General",
        tip: line,
      }));

    return {
      summary,
      substitutions: substitutions.length > 0 ? substitutions : fallbackExplainer(deck, score, player).substitutions,
      matchupTips: matchupTips.length > 0 ? matchupTips : fallbackExplainer(deck, score, player).matchupTips,
    };
  } catch (error) {
    console.warn(`Gemini request failed. Falling back. Reason: ${String(error)}`);
    return fallbackExplainer(deck, score, player);
  }
}
