import { Prisma } from "@prisma/client";
import type { RecommendationPayload } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";

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
