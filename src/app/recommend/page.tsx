import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  RecommendationResults,
  RecommendationResultsEmptyState,
  RecommendationResultsSkeleton,
} from "@/components/features/recommendation-results";
import { Container } from "@/components/ui/container";
import { SiteHeader } from "@/components/ui/site-header";
import { loadRecommendationBySession } from "@/lib/server/recommendation-loader";

export default function RecommendPage({ searchParams }: { searchParams: { sessionId?: string } }) {
  const sessionId = searchParams.sessionId;

  if (!sessionId) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader showPlayerSearch />
      <div className="relative flex-1 overflow-hidden py-16">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-[-10%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-1/4 top-[20%] h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[120px]" />
          <div className="absolute left-1/3 bottom-[10%] h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <Container className="relative">
          <Suspense fallback={<RecommendationResultsSkeleton />}>
            <RecommendationResultsSection sessionId={sessionId} />
          </Suspense>
        </Container>
      </div>
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
