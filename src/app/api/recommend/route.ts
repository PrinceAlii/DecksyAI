import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import type { DeckArchetype } from "@/lib/clash-royale";
import { deckCatalog } from "@/lib/data/deck-catalog";
import { fetchBattleArchetypeAggregate } from "@/lib/clash-royale";
import { generateExplainer } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
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

async function persistRecommendation(
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
  };

  await prisma.recommendation.upsert({
    where: { sessionId },
    update: data,
    create: data,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RecommendationPayload;

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
    await persistRecommendation(sessionId, body, breakdown, enrichedDecks);
  } else {
    saveRecommendation({
      sessionId,
      player: payload.player,
      quiz: payload.quiz,
      scoreBreakdown: breakdown,
      decks: enrichedDecks,
    });
  }

  return NextResponse.json(
    {
      sessionId,
      results: enrichedDecks,
    },
    { status: 200 },
  );
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (prisma) {
    const recommendation = await prisma.recommendation.findUnique({ where: { sessionId } });
    if (recommendation) {
      return NextResponse.json(recommendation, { status: 200 });
    }
  }

  const ephemeral = getRecommendation(sessionId);
  if (ephemeral) {
    return NextResponse.json(ephemeral, { status: 200 });
  }

  return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
}
