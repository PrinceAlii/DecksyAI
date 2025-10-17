import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  RecommendationResults,
  RecommendationResultsEmptyState,
  RecommendationResultsSkeleton,
} from "@/components/features/recommendation-results";
import { Container } from "@/components/ui/container";
import { loadRecommendationBySession } from "@/lib/server/recommendation-loader";

export default function RecommendPage({ searchParams }: { searchParams: { sessionId?: string } }) {
  const sessionId = searchParams.sessionId;

  if (!sessionId) {
    notFound();
  }

  return (
    <div className="bg-background py-16">
      <Container>
        <Suspense fallback={<RecommendationResultsSkeleton />}>
          <RecommendationResultsSection sessionId={sessionId} />
        </Suspense>
      </Container>
    </div>
  );
}

async function RecommendationResultsSection({ sessionId }: { sessionId: string }) {
  const recommendation = await loadRecommendationBySession(sessionId);

  if (!recommendation) {
    notFound();
  }

  const playerTag = recommendation.playerTag.replace(/^#/, "");

  if (recommendation.results.length === 0) {
    return <RecommendationResultsEmptyState sessionId={sessionId} />;
  }

  return (
    <RecommendationResults
      sessionId={sessionId}
      playerTag={playerTag}
      trophyInfo={recommendation.trophyInfo}
      results={recommendation.results}
    />
  );
}
