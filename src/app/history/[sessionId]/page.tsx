import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import {
  RecommendationResults,
  RecommendationResultsEmptyState,
  RecommendationResultsSkeleton,
} from "@/components/features/recommendation-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { loadRecommendationBySession } from "@/lib/server/recommendation-loader";
import type { RecommendationDeckResult, RecommendationScoreBreakdown } from "@/lib/types/recommendation";

interface HistorySessionPageProps {
  params: { sessionId: string };
}

export default function HistorySessionPage({ params }: HistorySessionPageProps) {
  const { sessionId } = params;

  return (
    <div className="bg-background py-16">
      <Container className="space-y-8">
        <Button asChild variant="ghost" className="gap-2 text-text-muted hover:text-text">
          <Link href="/history">
            <ArrowLeft className="size-4" /> Back to history
          </Link>
        </Button>
        <Suspense fallback={<RecommendationResultsSkeleton showHistoryNavigation={false} />}>
          <HistorySessionContent sessionId={sessionId} />
        </Suspense>
      </Container>
    </div>
  );
}

async function HistorySessionContent({ sessionId }: { sessionId: string }) {
  const recommendation = await loadRecommendationBySession(sessionId);

  if (!recommendation) {
    notFound();
  }

  const sanitizedTag = recommendation.playerTag.replace(/^#/, "");

  if (recommendation.results.length === 0) {
    return <RecommendationResultsEmptyState sessionId={sessionId} />;
  }

  return (
    <div className="space-y-8">
      <HistorySessionMetadata
        sessionId={recommendation.sessionId}
        createdAt={recommendation.createdAt}
        arena={recommendation.arena}
        trophyInfo={recommendation.trophyInfo}
      />
      <RecommendationResults
        sessionId={sessionId}
        playerTag={sanitizedTag}
        trophyInfo={recommendation.trophyInfo}
        results={recommendation.results}
        showHistoryNavigation={false}
      />
      <HistoryBreakdown breakdown={recommendation.breakdown} results={recommendation.results} />
    </div>
  );
}

function HistorySessionMetadata({
  sessionId,
  createdAt,
  arena,
  trophyInfo,
}: {
  sessionId: string;
  createdAt?: string;
  arena?: string;
  trophyInfo: string;
}) {
  return (
    <Card className="border-border/60 bg-surface">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-muted">Session ID</p>
          <p className="text-lg font-semibold text-text">{sessionId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
          <Badge variant="secondary">{arena ?? trophyInfo}</Badge>
          {createdAt && (
            <span className="flex items-center gap-2">
              <Clock className="size-4" />
              {new Date(createdAt).toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryBreakdown({
  breakdown,
  results,
}: {
  breakdown: RecommendationScoreBreakdown[];
  results: RecommendationDeckResult[];
}) {
  if (!breakdown.length) {
    return null;
  }

  const deckNameBySlug = new Map(results.map((result) => [result.deck.slug, result.deck.name]));

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-text">Original scoring breakdown</h2>
        <p className="text-sm text-text-muted">Compare the weighted scores that produced your recommendations.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {breakdown.map((entry) => {
          const deckName = deckNameBySlug.get(entry.deck) ?? entry.deck;
          return (
            <Card key={entry.deck} className="border-border/60 bg-surface">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Deck</p>
                    <p className="text-lg font-semibold text-text">{deckName}</p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Score {entry.total.toFixed(1)}
                  </Badge>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(entry.breakdown).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-muted/40 px-3 py-2"
                    >
                      <dt className="text-xs uppercase tracking-wide text-text-muted">{key}</dt>
                      <dd className="text-sm font-semibold text-text">{value}</dd>
                    </div>
                  ))}
                </dl>
                {entry.notes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Notes</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-text-muted">
                      {entry.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
