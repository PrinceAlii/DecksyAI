import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { listRecommendations } from "@/lib/recommendation-store";

export async function GET() {
  if (!prisma) {
    const recommendations = listRecommendations().map((record) => {
      const player = record.player as { arena?: string } | undefined;
      const quiz = record.quiz as { preferredPace?: string } | undefined;
      return {
        sessionId: record.sessionId,
        arena: player?.arena ?? "Unknown arena",
        playstyle: quiz?.preferredPace ?? "Unknown",
        createdAt: new Date().toISOString(),
        decks: record.decks,
      };
    });
    return NextResponse.json({ recommendations }, { status: 200 });
  }

  const recommendations = await prisma.recommendation.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ recommendations }, { status: 200 });
}
