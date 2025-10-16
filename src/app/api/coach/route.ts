import { NextRequest, NextResponse } from "next/server";

import { deckCatalog, getDeckBySlug } from "@/lib/data/deck-catalog";
import { generateExplainer } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { RecommendationPayload, scoreDeck } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RecommendationPayload & { deckSlug?: string };
  const deck = body.deckSlug ? getDeckBySlug(body.deckSlug) : deckCatalog[0];

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const score = scoreDeck(deck, body);
  const explainer = await generateExplainer(deck, score, body.player);

  return NextResponse.json({ deck, score, explainer }, { status: 200 });
}

export async function GET(request: NextRequest) {
  const deckSlug = request.nextUrl.searchParams.get("deck");
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!deckSlug) {
    return NextResponse.json({ error: "deck parameter required" }, { status: 400 });
  }

  const deck = getDeckBySlug(deckSlug);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  if (!sessionId || !prisma) {
    return NextResponse.json({ deck }, { status: 200 });
  }

  const recommendation = await prisma.recommendation.findUnique({ where: { sessionId } });
  const explainers = await prisma.explainer.findMany({
    where: { deck: { slug: deckSlug }, recommendationId: recommendation?.id },
  });

  return NextResponse.json({ deck, explainers }, { status: 200 });
}
