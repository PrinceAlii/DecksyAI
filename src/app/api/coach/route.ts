import { NextRequest, NextResponse } from "next/server";

import { deckCatalog, getDeckBySlug } from "@/lib/data/deck-catalog";
import { generateExplainer, generateExplainerStream } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { RecommendationPayload, scoreDeck, DeckScore, PlayerProfile } from "@/lib/scoring";
import { getRecommendation } from "@/lib/recommendation-store";

type ScoreBreakdownSnapshot = {
  deck: string;
  total: number;
  breakdown: DeckScore["breakdown"];
  notes: string[];
};

async function resolveStreamingContext(deckSlug: string, sessionId: string | null) {
  const deck = getDeckBySlug(deckSlug);

  if (!deck) {
    return null;
  }

  if (!sessionId) {
    return null;
  }

  const ephemeral = getRecommendation(sessionId);

  if (ephemeral) {
    const player = ephemeral.player as PlayerProfile | undefined;
    const breakdowns = ephemeral.scoreBreakdown as ScoreBreakdownSnapshot[];
    const match = breakdowns?.find((entry) => entry.deck === deckSlug);

    if (player && match) {
      const score: DeckScore = {
        deck,
        score: match.total,
        breakdown: match.breakdown,
        notes: match.notes,
      };

      return { deck, player, score };
    }
  }

  if (prisma) {
    const recommendation = await prisma.recommendation.findUnique({ where: { sessionId } });
    if (recommendation) {
      const breakdowns = (recommendation.scoreBreakdown as ScoreBreakdownSnapshot[]) ?? [];
      const match = breakdowns.find((entry) => entry.deck === deckSlug);

      if (match) {
        const player: PlayerProfile = {
          tag: recommendation.playerTag,
          name: recommendation.playerTag,
          trophies: Number.parseInt(recommendation.trophyRange, 10) || 0,
          arena: recommendation.arena,
          collection: [],
        };

        const score: DeckScore = {
          deck,
          score: match.total,
          breakdown: match.breakdown,
          notes: match.notes,
        };

        return { deck, player, score };
      }
    }
  }

  return null;
}

function streamExplainerResponse(deckSlug: string, sessionId: string | null) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const context = await resolveStreamingContext(deckSlug, sessionId);

        if (!context) {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                type: "error",
                error: "Unable to resolve recommendation context for stream.",
              })}\n`,
            ),
          );
          controller.close();
          return;
        }

        const iterator = generateExplainerStream(context.deck, context.score, context.player);

        while (true) {
          const { value, done } = await iterator.next();
          if (done) {
            break;
          }

          controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        }

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "error",
              error: `Stream failed: ${String(error)}`,
            })}\n`,
          ),
        );
        controller.close();
      }
    },
  });
}

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
  const shouldStream = request.nextUrl.searchParams.get("stream") === "1";

  if (!deckSlug) {
    return NextResponse.json({ error: "deck parameter required" }, { status: 400 });
  }

  if (shouldStream) {
    const stream = streamExplainerResponse(deckSlug, sessionId);
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
      },
    });
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
