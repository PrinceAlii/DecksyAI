import { NextRequest, NextResponse } from "next/server";

import { coachRequestSchema, coachResponseSchema, coachScoreSchema, errorResponseSchema, explainerSchema } from "@/app/api/_schemas";
import { deckCatalog, getDeckBySlug } from "@/lib/data/deck-catalog";
import { generateExplainer, generateExplainerStream } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, withRetryHeaders } from "@/lib/rate-limit";
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
  const rateLimitState = await enforceRateLimit({
    request,
    resource: "api:coach:post",
    limit: 12,
    refillIntervalMs: 60_000,
  });

  if (!rateLimitState.ok) {
    const response = NextResponse.json(
      errorResponseSchema.parse({ error: "Too many coaching requests" }),
      { status: 429 },
    );
    return withRetryHeaders(response, rateLimitState);
  }

  const parsed = coachRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    const response = NextResponse.json(
      errorResponseSchema.parse({ error: "Invalid coaching payload", details: parsed.error.flatten() }),
      { status: 400 },
    );
    return withRetryHeaders(response, rateLimitState);
  }

  const body = parsed.data as RecommendationPayload & { deckSlug?: string };
  const deck = body.deckSlug ? getDeckBySlug(body.deckSlug) : deckCatalog[0];

  if (!deck) {
    return withRetryHeaders(
      NextResponse.json(errorResponseSchema.parse({ error: "Deck not found" }), { status: 404 }),
      rateLimitState,
    );
  }

  const score = scoreDeck(deck, body);
  const explainer = await generateExplainer(deck, score, body.player);
  const responsePayload = coachResponseSchema.parse({
    deck,
    score: coachScoreSchema.parse({
      total: score.score,
      breakdown: score.breakdown,
      notes: score.notes.length > 0 ? score.notes : undefined,
    }),
    explainer,
  });

  const response = NextResponse.json(responsePayload, { status: 200 });
  return withRetryHeaders(response, rateLimitState);
}

export async function GET(request: NextRequest) {
  const deckSlug = request.nextUrl.searchParams.get("deck");
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const shouldStream = request.nextUrl.searchParams.get("stream") === "1";

  if (!deckSlug) {
    return NextResponse.json(errorResponseSchema.parse({ error: "deck parameter required" }), { status: 400 });
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
    return NextResponse.json(errorResponseSchema.parse({ error: "Deck not found" }), { status: 404 });
  }

  if (!sessionId || !prisma) {
    const payload = coachResponseSchema.parse({ deck });
    return NextResponse.json(payload, { status: 200 });
  }

  const recommendation = await prisma.recommendation.findUnique({ where: { sessionId } });
  const explainers = await prisma.explainer.findMany({
    where: { deck: { slug: deckSlug }, recommendationId: recommendation?.id },
  });
  const normalisedExplainers = explainers
    .map((entry) => ({
      summary: entry.summary,
      substitutions: entry.substitutions as unknown,
      matchupTips: entry.matchupTips as unknown,
    }))
    .map((payload) => explainerSchema.parse(payload));

  const payload = coachResponseSchema.parse({ deck, explainers: normalisedExplainers });
  return NextResponse.json(payload, { status: 200 });
}
