import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Clock } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default async function HistoryPage() {
  const requestHeaders = headers();
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() && process.env.NEXT_PUBLIC_BASE_URL.trim().length > 0
      ? process.env.NEXT_PUBLIC_BASE_URL.trim()
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://${requestHeaders.get("host") ?? "localhost:3000"}`;

  const recommendations = await fetchHistory(origin);

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

        <div className="grid gap-4">
          {recommendations.length === 0 ? (
            <Card className="border-border/60 bg-surface">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-text-muted">
                <Clock className="size-6" />
                <p>No history yet. Generate a recommendation to start tracking.</p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((recommendation) => (
              <Card key={recommendation.sessionId} className="border-border/60 bg-surface">
                <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Session {recommendation.sessionId}</p>
                    <p className="text-base text-text">{recommendation.arena ?? "Unknown arena"}</p>
                    <p className="text-xs text-text-muted">{recommendation.playstyle ?? "Playstyle unknown"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{recommendation.createdAt ? new Date(recommendation.createdAt).toLocaleString() : "Pending"}</Badge>
                    <Button asChild variant="outline">
                      <Link href={`/recommend?sessionId=${recommendation.sessionId}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Container>
    </div>
  );
}
