import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import { deckCatalog } from "@/lib/data/deck-catalog";
import { generateExplainer } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { rankDecks, RecommendationPayload } from "@/lib/scoring";
import { getRecommendation, saveRecommendation } from "@/lib/recommendation-store";

async function persistRecommendation(
  sessionId: string,
  payload: RecommendationPayload,
  breakdown: unknown,
  explainers: unknown,
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
    rationale: payload.quiz as unknown as Prisma.JsonObject,
    scoreBreakdown: breakdown as Prisma.JsonArray,
    decks: explainers as Prisma.JsonArray,
  };

  await prisma.recommendation.upsert({
    where: { sessionId },
    update: data,
    create: data,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RecommendationPayload;

  const sessionId = randomUUID();
  const scores = rankDecks(deckCatalog, body);

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
      player: body.player,
      quiz: body.quiz,
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
