import { notFound } from "next/navigation";

import { RecommendationResults, RecommendationDeckResult } from "@/components/features/recommendation-results";
import { Container } from "@/components/ui/container";
import { DeckDefinition } from "@/lib/data/deck-catalog";
import { prisma } from "@/lib/prisma";
import { getRecommendation } from "@/lib/recommendation-store";

interface RecommendationRecord {
  sessionId: string;
  player?: {
    tag: string;
    trophies: number;
    arena: string;
  };
  playerTag?: string;
  trophyRange?: string;
  arena?: string;
  scoreBreakdown?: unknown;
  decks?: unknown;
}

function parseDecks(value: unknown): RecommendationDeckResult[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const record = item as {
        deck: DeckDefinition;
        score: number;
        breakdown: RecommendationDeckResult["breakdown"];
        notes: string[];
        explainer?: RecommendationDeckResult["explainer"];
      };
      return record.deck ? record : null;
    })
    .filter((item): item is RecommendationDeckResult => Boolean(item && item.deck));
}

export default async function RecommendPage({ searchParams }: { searchParams: { sessionId?: string } }) {
  const sessionId = searchParams.sessionId;

  if (!sessionId) {
    notFound();
  }

  let data: RecommendationRecord | null = null;

  if (prisma) {
    const record = await prisma.recommendation.findUnique({ where: { sessionId } });
    if (record) {
      data = {
        sessionId: record.sessionId,
        playerTag: record.playerTag,
        arena: record.arena,
        decks: record.decks,
      };
    }
  } else {
    const record = getRecommendation(sessionId);
    if (record) {
      data = {
        sessionId: record.sessionId,
        player: record.player as RecommendationRecord["player"],
        decks: record.decks,
      };
    }
  }

  if (!data) {
    notFound();
  }

  const decks = parseDecks(data.decks ?? data.scoreBreakdown);

  if (decks.length === 0) {
    notFound();
  }

  const playerTag = data.player?.tag ?? data.playerTag ?? "unknown";
  const trophyInfo = data.player?.arena ?? data.arena ?? "Arena";

  return (
    <div className="bg-background py-16">
      <Container>
        <RecommendationResults
          sessionId={sessionId}
          playerTag={playerTag.replace("#", "")}
          trophyInfo={trophyInfo}
          results={decks}
        />
      </Container>
    </div>
  );
}
