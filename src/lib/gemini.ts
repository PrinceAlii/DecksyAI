import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { DeckDefinition } from "@/lib/data/deck-catalog";
import { getServerEnv, isDevelopment } from "@/lib/env";
import { cacheGet, cacheSet } from "@/lib/redis";
import { DeckScore, PlayerProfile } from "@/lib/scoring";

export interface GeminiPracticeDrill {
  focus: string;
  drill: string;
  reps?: string;
}

export interface GeminiExplainer {
  summary: string;
  substitutions: { card: string; suggestion: string }[];
  matchupTips: { archetype: string; tip: string }[];
  practicePlan?: GeminiPracticeDrill[];
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
    practicePlan: [
      {
        focus: "Opening tempo",
        drill: "Play 3 trainer battles focusing on single-lane pressure to feel the deck's cycle cadence.",
        reps: "3 matches",
      },
      {
        focus: "Counter-push discipline",
        drill: "Review replays and only counter-push after a positive elixir trade to reinforce patience.",
      },
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
  practicePlan: z
    .array(
      z
        .object({
          focus: z.string(),
          drill: z.string(),
          reps: z.string().optional(),
        })
        .strict(),
    )
    .max(4)
    .optional(),
});

type GeminiExplainerPayload = z.infer<typeof geminiExplainerSchema>;

export function buildPrompt(deck: DeckDefinition, score: DeckScore, player: PlayerProfile, preferences?: string): string {
  const cardList = deck.cards.map((card) => card.name).join(", ");
  const trophyText = typeof player.trophies === "number" ? `${player.trophies} trophies` : "unknown trophy count";
  const arenaText = player.arena ? `Arena ${player.arena}` : "an unknown arena";
  
  const preferencesText = preferences?.trim() 
    ? ` The player specifically requested: "${preferences}". Take this into account when explaining why this deck fits.`
    : "";

  return [
    "You are Decksy AI, an expert Clash Royale strategy assistant.",
    `Explain why the deck ${deck.name} matches this player who is at ${trophyText} in ${arenaText}. Focus on skill fit, collection readiness, and tempo guidance without mentioning any player names or tags.${preferencesText}`,
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

export function parseGeminiPayload(raw: string, silent = false): GeminiExplainerPayload | null {
  const cleaned = raw.replace(/```json|```/g, "").trim();

  // Quick checks for incomplete JSON:
  // 1. Must start with { and end with }
  // 2. Count of opening and closing braces should match
  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
    return null;
  }

  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    return null;
  }

  try {
    const parsed = JSON.parse(cleaned);
    const result = geminiExplainerSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch (error) {
    // During streaming, incomplete JSON is expected, so only log if not silent
    if (!silent) {
      console.warn(`Failed to parse Gemini response as JSON: ${String(error)}`);
    }
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
  const practicePlan = (payload.practicePlan ?? [])
    .map((item) => ({
      focus: item.focus.trim(),
      drill: item.drill.trim(),
      reps: item.reps?.trim() ?? undefined,
    }))
    .filter((item) => item.focus.length > 0 && item.drill.length > 0)
    .slice(0, 4);

  return {
    summary: summary && summary.length > 0 ? summary : fallback.summary,
    substitutions: substitutions.length > 0 ? substitutions : fallback.substitutions,
    matchupTips: matchupTips.length > 0 ? matchupTips : fallback.matchupTips,
    practicePlan: practicePlan.length > 0 ? practicePlan : fallback.practicePlan,
  };
}

export type GeminiExplainerStreamEvent =
  | { type: "cached"; payload: GeminiExplainer; model: "cache" }
  | { type: "start"; model: string }
  | { type: "delta"; rawText: string; model: string }
  | { type: "update"; payload: GeminiExplainer; model: string }
  | { type: "complete"; payload: GeminiExplainer; model: string }
  | { type: "error"; error: string; fallback: GeminiExplainer };

export async function* generateExplainerStream(
  deck: DeckDefinition,
  score: DeckScore,
  player: PlayerProfile,
  preferences?: string,
): AsyncGenerator<GeminiExplainerStreamEvent, GeminiExplainer, void> {
  const env = getServerEnv();
  const fallback = fallbackExplainer(deck, score, player);

  if (!env.GEMINI_API_KEY) {
    if (isDevelopment()) {
      console.warn("GEMINI_API_KEY missing. Using fallback explainer.");
    }
    yield { type: "error", error: "Missing Gemini API key", fallback };
    return fallback;
  }

  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const preferredModel = env.GEMINI_MODEL?.trim();
  const cacheKey = buildCacheKey(preferredModel ?? "auto", deck, score, player);
  const cached = await cacheGet<GeminiExplainer>(cacheKey);

  if (cached) {
    yield { type: "cached", payload: cached, model: "cache" };
    return cached;
  }

  const candidateModels = Array.from(
    new Set(
      [preferredModel, ...DEFAULT_MODEL_CHAIN].filter(
        (model): model is string => typeof model === "string" && model.length > 0,
      ),
    ),
  );

  const prompt = buildPrompt(deck, score, player, preferences);

  for (const modelId of candidateModels) {
    try {
      const model = client.getGenerativeModel({ model: modelId });
      yield { type: "start", model: modelId };

      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });

      let buffer = "";

      for await (const event of result.stream) {
        const text = event.text();
        if (!text) {
          continue;
        }

        buffer += text;
        yield { type: "delta", rawText: buffer, model: modelId };

        // Try to parse, but suppress errors during streaming (incomplete JSON is expected)
        const payload = parseGeminiPayload(buffer, true);
        if (payload) {
          yield { type: "update", payload: normaliseExplainer(payload, fallback), model: modelId };
        }
      }

      // Final parse with error logging enabled
      const payload = parseGeminiPayload(buffer, false);

      if (!payload) {
        throw new Error("Gemini response not in expected JSON format");
      }

      const explainer = normaliseExplainer(payload, fallback);
      await cacheSet(cacheKey, explainer, CACHE_TTL_SECONDS);
      yield { type: "complete", payload: explainer, model: modelId };
      return explainer;
    } catch (error) {
      console.warn(`[Gemini] Model ${modelId} failed. Falling back. Reason: ${String(error)}`);
    }
  }

  console.warn("Gemini request failed after trying all models. Using fallback explainer.");
  yield { type: "error", error: "Gemini request failed after trying all models.", fallback };
  return fallback;
}

export async function generateExplainer(
  deck: DeckDefinition,
  score: DeckScore,
  player: PlayerProfile,
  preferences?: string,
): Promise<GeminiExplainer> {
  const iterator = generateExplainerStream(deck, score, player, preferences);
  let latest: GeminiExplainer | null = null;

  while (true) {
    const { value, done } = await iterator.next();
    if (done) {
      return value ?? latest ?? fallbackExplainer(deck, score, player);
    }

    if (value.type === "cached" || value.type === "update" || value.type === "complete") {
      latest = value.payload;
    }

    if (value.type === "error") {
      latest = value.fallback;
    }
  }
}
