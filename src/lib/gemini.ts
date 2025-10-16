import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { DeckDefinition } from "@/lib/data/deck-catalog";
import { getServerEnv, isDevelopment } from "@/lib/env";
import { cacheGet, cacheSet } from "@/lib/redis";
import { DeckScore, PlayerProfile } from "@/lib/scoring";

interface GeminiExplainer {
  summary: string;
  substitutions: { card: string; suggestion: string }[];
  matchupTips: { archetype: string; tip: string }[];
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

const DEFAULT_MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"] as const;
const CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours

const geminiExplainerSchema = z.object({
  summary: z.string(),
  substitutions: z
    .array(z.object({ card: z.string(), suggestion: z.string() }))
    .max(3)
    .optional(),
  matchupTips: z
    .array(z.object({ archetype: z.string(), tip: z.string() }))
    .max(3)
    .optional(),
});

type GeminiExplainerPayload = z.infer<typeof geminiExplainerSchema>;

export function buildPrompt(deck: DeckDefinition, score: DeckScore, player: PlayerProfile): string {
  const cardList = deck.cards.map((card) => card.name).join(", ");
  const trophyText = typeof player.trophies === "number" ? `${player.trophies} trophies` : "unknown trophy count";
  const arenaText = player.arena ? `Arena ${player.arena}` : "an unknown arena";

  return [
    "You are Decksy AI, an expert Clash Royale strategy assistant.",
    `Explain why the deck ${deck.name} matches this player who is at ${trophyText} in ${arenaText}. Focus on skill fit, collection readiness, and tempo guidance without mentioning any player names or tags.`,
    `Deck cards: ${cardList}.`,
    `Score breakdown (0-100): collection ${score.breakdown.collection}, trophies ${score.breakdown.trophies}, playstyle ${score.breakdown.playstyle}, difficulty ${score.breakdown.difficulty}.`,
    "Tone requirements: confident, encouraging, and tactical. Open with the key win condition, then provide actionable sequencing tips and matchup posture.",
    "Format the summary as two short paragraphs separated by a blank line. Keep sentences tight and avoid fluff.",
    "Respond strictly as compact JSON with shape {\"summary\": string, \"substitutions\": [{\"card\": string, \"suggestion\": string}], \"matchupTips\": [{\"archetype\": string, \"tip\": string}]}. Omit fields that would be empty and keep each list to at most three items tailored to the player's collection gaps.",
  ].join(" ");
}

function sanitisePlayerTag(tag: string): string {
  const cleaned = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return cleaned.length > 0 ? cleaned : "unknown";
}

function buildCacheKey(
  modelPreference: string,
  deck: DeckDefinition,
  score: DeckScore,
  player: PlayerProfile,
): string {
  const signature = [
    deck.slug,
    sanitisePlayerTag(player.tag),
    Math.round(score.breakdown.collection),
    Math.round(score.breakdown.trophies),
    Math.round(score.breakdown.playstyle),
    Math.round(score.breakdown.difficulty),
  ].join(":");

  return `gemini:explainer:${modelPreference}:${signature}`;
}

export function parseGeminiPayload(raw: string): GeminiExplainerPayload | null {
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const result = geminiExplainerSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch (error) {
    console.warn(`Failed to parse Gemini response as JSON: ${String(error)}`);
    return null;
  }
}

function normaliseExplainer(payload: GeminiExplainerPayload, fallback: GeminiExplainer): GeminiExplainer {
  const summary = payload.summary?.trim();
  const substitutions = (payload.substitutions ?? [])
    .map((item) => ({ card: item.card.trim(), suggestion: item.suggestion.trim() }))
    .filter((item) => item.card.length > 0 && item.suggestion.length > 0)
    .slice(0, 3);
  const matchupTips = (payload.matchupTips ?? [])
    .map((item) => ({ archetype: item.archetype.trim(), tip: item.tip.trim() }))
    .filter((item) => item.archetype.length > 0 && item.tip.length > 0)
    .slice(0, 3);

  return {
    summary: summary && summary.length > 0 ? summary : fallback.summary,
    substitutions: substitutions.length > 0 ? substitutions : fallback.substitutions,
    matchupTips: matchupTips.length > 0 ? matchupTips : fallback.matchupTips,
  };
}

export async function generateExplainer(deck: DeckDefinition, score: DeckScore, player: PlayerProfile): Promise<GeminiExplainer> {
  const env = getServerEnv();
  const fallback = fallbackExplainer(deck, score, player);

  if (!env.GEMINI_API_KEY) {
    if (isDevelopment()) {
      console.warn("GEMINI_API_KEY missing. Using fallback explainer.");
    }
    return fallback;
  }

  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const preferredModel = env.GEMINI_MODEL?.trim();
  const cacheKey = buildCacheKey(preferredModel ?? "auto", deck, score, player);
  const cached = await cacheGet<GeminiExplainer>(cacheKey);

  if (cached) {
    return cached;
  }

  const candidateModels = Array.from(
    new Set(
      [preferredModel, ...DEFAULT_MODEL_CHAIN].filter(
        (model): model is string => typeof model === "string" && model.length > 0,
      ),
    ),
  );

  const prompt = buildPrompt(deck, score, player);

  for (const modelId of candidateModels) {
    try {
      const model = client.getGenerativeModel({ model: modelId });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });

      const text = response.response.text();

      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      const payload = parseGeminiPayload(text);

      if (!payload) {
        throw new Error("Gemini response not in expected JSON format");
      }

      const explainer = normaliseExplainer(payload, fallback);
      await cacheSet(cacheKey, explainer, CACHE_TTL_SECONDS);
      return explainer;
    } catch (error) {
      console.warn(`[Gemini] Model ${modelId} failed. Falling back. Reason: ${String(error)}`);
    }
  }

  console.warn("Gemini request failed after trying all models. Using fallback explainer.");
  return fallback;
}
