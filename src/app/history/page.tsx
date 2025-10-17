import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Clock } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoryRecord {
  sessionId: string;
  createdAt?: string;
  arena?: string;
  playstyle?: string;
  decks?: unknown;
}

async function fetchHistory(origin: string): Promise<HistoryRecord[]> {
  const url = new URL("/api/history", origin);
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { recommendations: HistoryRecord[] };
  return data.recommendations ?? [];
}

export default function HistoryPage() {
  const requestHeaders = headers();
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() && process.env.NEXT_PUBLIC_BASE_URL.trim().length > 0
      ? process.env.NEXT_PUBLIC_BASE_URL.trim()
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://${requestHeaders.get("host") ?? "localhost:3000"}`;

  return (
    <div className="bg-background py-16">
      <Container className="space-y-8">
        <Button asChild variant="ghost" className="gap-2 text-text-muted hover:text-text">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-text">Recommendation history</h1>
          <p className="text-sm text-text-muted">Last 10 sessions saved with your consent.</p>
        </div>

        <Suspense fallback={<HistoryListSkeleton />}>
          <HistoryList origin={origin} />
        </Suspense>
      </Container>
    </div>
  );
}

async function HistoryList({ origin }: { origin: string }) {
  const recommendations = await fetchHistory(origin);

  if (recommendations.length === 0) {
    return <HistoryEmptyState />;
  }

  return (
    <div className="grid gap-4">
      {recommendations.map((recommendation) => (
        <Card key={recommendation.sessionId} className="border-border/60 bg-surface">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-text-muted">Session {recommendation.sessionId}</p>
              <p className="text-base text-text">{recommendation.arena ?? "Unknown arena"}</p>
              <p className="text-xs text-text-muted">{recommendation.playstyle ?? "Playstyle unknown"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {recommendation.createdAt ? new Date(recommendation.createdAt).toLocaleString() : "Pending"}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/history/${recommendation.sessionId}`}>View details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HistoryEmptyState() {
  return (
    <Card className="border-border/60 bg-surface">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-text-muted">
        <Clock className="size-6" />
        <p>No history yet. Generate a recommendation to start tracking.</p>
        <Button asChild variant="outline">
          <Link href="/">Start a recommendation</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function HistoryListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="border-border/60 bg-surface">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
