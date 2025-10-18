import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import type { DeckArchetype } from "@/lib/clash-royale";
import {
  deckScoreSchema,
  errorResponseSchema,
  recommendationPayloadSchema,
  recommendationResponseSchema,
} from "@/app/api/_schemas";
import { deckCatalog } from "@/lib/data/deck-catalog";
import { fetchBattleArchetypeAggregate } from "@/lib/clash-royale";
import { generateExplainer } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, withRetryHeaders } from "@/lib/rate-limit";
import { rankDecks, RecommendationPayload } from "@/lib/scoring";
import { getRecommendation, saveRecommendation } from "@/lib/recommendation-store";

async function resolveFeedbackPreferences(userId?: string) {
  if (!userId || !prisma) {
    return undefined;
  }

  const record = await prisma.feedbackPreference.findUnique({ where: { userId } });
  if (!record) {
    return undefined;
  }

  return {
    collectionWeight: record.collectionWeight,
    trophiesWeight: record.trophiesWeight,
    playstyleWeight: record.playstyleWeight,
    difficultyWeight: record.difficultyWeight,
    preferArchetypes: (record.preferArchetypes as DeckArchetype[] | null) ?? undefined,
    avoidArchetypes: (record.avoidArchetypes as DeckArchetype[] | null) ?? undefined,
  };
}

export async function persistRecommendation(
  sessionId: string,
  payload: RecommendationPayload,
  breakdown: unknown,
  enrichedDecks: unknown,
) {
  if (!prisma) {
    return;
  }

  const data: Prisma.RecommendationCreateInput = {
    sessionId,
    playerTag: payload.player.tag,
    trophyRange: `${payload.player.trophies}`,
    arena: payload.player.arena,
    playstyle: payload.quiz.preferredPace,
    rationale: payload.quiz as unknown as Prisma.InputJsonValue,
    scoreBreakdown: breakdown as unknown as Prisma.InputJsonValue,
    decks: enrichedDecks as unknown as Prisma.InputJsonValue,
    ...(payload.userId
      ? {
          user: {
            connect: { id: payload.userId },
          },
        }
      : {}),
  };

  await prisma.recommendation.upsert({
    where: { sessionId },
    update: data,
    create: data,
  });
}

export async function POST(request: NextRequest) {
  const rateLimitState = await enforceRateLimit({
    request,
    resource: "api:recommend:post",
    limit: 8,
    refillIntervalMs: 60_000,
  });

  if (!rateLimitState.ok) {
    const response = NextResponse.json(
      errorResponseSchema.parse({ error: "Too many recommendation requests" }),
      { status: 429 },
    );
    return withRetryHeaders(response, rateLimitState);
  }

  const parsed = recommendationPayloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    const response = NextResponse.json(
      errorResponseSchema.parse({ error: "Invalid recommendation payload", details: parsed.error.flatten() }),
      { status: 400 },
    );
    return withRetryHeaders(response, rateLimitState);
  }

  const body = parsed.data as RecommendationPayload;

  const [battleAggregate, feedbackPreferences] = await Promise.all([
    body.player?.tag ? fetchBattleArchetypeAggregate(body.player.tag).catch(() => undefined) : Promise.resolve(undefined),
    body.feedbackPreferences ? Promise.resolve(body.feedbackPreferences) : resolveFeedbackPreferences(body.userId),
  ]);

  const payload: RecommendationPayload = {
    ...body,
    battleAggregate: battleAggregate ?? body.battleAggregate,
    feedbackPreferences: feedbackPreferences ?? body.feedbackPreferences,
  };

  const sessionId = randomUUID();
  const scores = rankDecks(deckCatalog, payload);

  const breakdown = scores.map((score) => ({
    deck: score.deck.slug,
    total: score.score,
    breakdown: score.breakdown,
    notes: score.notes,
  }));

  const explainers = await Promise.all(
    scores.map(async (score) => ({
      slug: score.deck.slug,
      explainer: await generateExplainer(score.deck, score, body.player),
    })),
  );

  const enrichedDecks = scores.map((score) => ({
    deck: score.deck,
    score: score.score,
    breakdown: score.breakdown,
    notes: score.notes,
    explainer: explainers.find((item) => item.slug === score.deck.slug)?.explainer,
  }));

  if (prisma) {
    await persistRecommendation(sessionId, payload, breakdown, enrichedDecks);
  } else {
    saveRecommendation({
      sessionId,
      player: payload.player,
      quiz: payload.quiz,
      scoreBreakdown: breakdown,
      decks: enrichedDecks,
      userId: payload.userId,
    });
  }

  const responsePayload = recommendationResponseSchema.parse({
    sessionId,
    results: enrichedDecks,
  });

  const response = NextResponse.json(responsePayload, { status: 200 });
  return withRetryHeaders(response, rateLimitState);
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(errorResponseSchema.parse({ error: "sessionId is required" }), { status: 400 });
  }

  if (prisma) {
    const recommendation = await prisma.recommendation.findUnique({ where: { sessionId } });
    if (recommendation) {
      const parsed = deckScoreSchema.array().safeParse(recommendation.decks);
      if (parsed.success) {
        const payload = recommendationResponseSchema.parse({ sessionId, results: parsed.data });
        return NextResponse.json(payload, { status: 200 });
      }
    }
  }

  const ephemeral = getRecommendation(sessionId);
  if (ephemeral) {
    const parsed = deckScoreSchema.array().safeParse(ephemeral.decks);
    if (parsed.success) {
      const payload = recommendationResponseSchema.parse({ sessionId, results: parsed.data });
      return NextResponse.json(payload, { status: 200 });
    }
  }

  return NextResponse.json(errorResponseSchema.parse({ error: "Recommendation not found" }), { status: 404 });
}
