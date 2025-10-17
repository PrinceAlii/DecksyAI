"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeckCard } from "@/lib/data/deck-catalog";
import { CARD_ART_PLACEHOLDER, getCardArtUrl, getExternalCardArtUrl } from "@/lib/data/card-art";
import type { RecommendationDeckResult } from "@/lib/types/recommendation";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendationResultsProps {
  sessionId: string;
  playerTag: string;
  trophyInfo: string;
  results: RecommendationDeckResult[];
  showHistoryNavigation?: boolean;
}

function DeckCardTile({ card }: { card: DeckCard }) {
  const [errorCount, setErrorCount] = useState(0);
  
  // Try local first, then external CDN, then placeholder
  const getImageSrc = () => {
    if (errorCount === 0) {
      return getCardArtUrl(card);
    } else if (errorCount === 1) {
      return getExternalCardArtUrl(card);
    }
    return CARD_ART_PLACEHOLDER;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-background/80 p-3 text-center transition hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border/60 bg-surface">
        <Image
          src={imageSrc}
          alt={card.name}
          fill
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 160px"
          className="object-cover"
          unoptimized
          onError={() => {
            // Try next fallback
            if (errorCount < 2) {
              setErrorCount(errorCount + 1);
            }
          }}
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">{card.name}</p>
        <p className="text-xs text-text-muted">Lvl {card.levelRequirement}</p>
      </div>
    </div>
  );
}

export function RecommendationResults({
  sessionId,
  playerTag,
  trophyInfo,
  results,
  showHistoryNavigation = true,
}: RecommendationResultsProps) {
  if (results.length === 0) {
    return <RecommendationResultsEmptyState sessionId={sessionId} />;
  }

  const [selectedDeck, setSelectedDeck] = useState(results[0]?.deck.slug ?? "");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackChannel, setFeedbackChannel] = useState("");
  const router = useRouter();

  const activeDeck = results.find((result) => result.deck.slug === selectedDeck) ?? results[0];

  async function submitFeedback(rating: number) {
    try {
      setSubmittingFeedback(true);
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          rating,
          notes: feedbackNotes.length > 0 ? feedbackNotes : undefined,
          channel: feedbackChannel,
        }),
      });
      setFeedbackNotes("");
      setFeedbackChannel("");
    } catch (error) {
      console.warn("Unable to send feedback", error);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  return (
    <div className="space-y-10">
      {showHistoryNavigation && (
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="gap-2 text-text-muted hover:text-text">
            <Link href="/history">
              <ArrowLeft className="size-4" />
              Back to history
            </Link>
          </Button>
        </div>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-text">Your deck recommendations</h1>
          <p className="text-sm text-text-muted">Tag #{playerTag} • {trophyInfo}</p>
        </div>
        {showHistoryNavigation && (
          <Button variant="outline" className="gap-2" onClick={() => router.push("/history")}>View history</Button>
        )}
      </header>

      <div className="grid gap-8 items-start lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap gap-2">
              {results.map((result) => (
                <Button
                  key={result.deck.slug}
                  variant={selectedDeck === result.deck.slug ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDeck(result.deck.slug)}
                >
                  {result.deck.name}
                  <Badge variant="secondary" className="ml-2">{result.score}</Badge>
                </Button>
              ))}
            </div>

            {activeDeck && (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-6 rounded-xl border border-border/80 bg-surface-muted/40 p-6 shadow-[0_8px_32px_rgba(10,15,25,0.35)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-text">{activeDeck.deck.name}</h2>
                      <p className="text-sm text-text-muted">{activeDeck.deck.description}</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-background/80 px-4 py-3 text-right shadow-inner">
                      <span className="text-sm text-text-muted">Average elixir</span>
                      <span className="text-2xl font-semibold text-accent">{activeDeck.deck.averageElixir.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(activeDeck.breakdown).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border/70 bg-background/80 px-4 py-3 shadow-sm"
                      >
                        <span className="text-sm capitalize text-text-muted">{key}</span>
                        <span className="text-lg font-semibold text-text">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-medium uppercase tracking-wide text-text-muted">Deck cards</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {activeDeck.deck.cards.map((card) => {
                        return <DeckCardTile key={card.key} card={card} />;
                      })}
                    </div>
                  </div>

                  {activeDeck.notes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-text">Coaching notes</p>
                      <ul className="list-disc space-y-2 pl-5 text-sm text-text-muted">
                        {activeDeck.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="secondary">
                      <Link href={`/deck/${activeDeck.deck.slug}?sessionId=${sessionId}`}>Open deck guide</Link>
                    </Button>
                  </div>
                </section>

                {activeDeck.explainer && (
                  <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-surface-muted/30 p-6">
                    <h3 className="text-lg font-semibold text-text">Gemini insights</h3>
                    <p className="text-sm leading-relaxed text-text-muted">{activeDeck.explainer.summary}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-text">Substitutions</h4>
                        <ul className="mt-2 space-y-2 text-sm text-text-muted">
                          {activeDeck.explainer.substitutions.map((sub) => (
                            <li key={`${sub.card}-${sub.suggestion}`}>{sub.card}: {sub.suggestion}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text">Matchup tips</h4>
                        <ul className="mt-2 space-y-2 text-sm text-text-muted">
                          {activeDeck.explainer.matchupTips.map((tip) => (
                            <li key={`${tip.archetype}-${tip.tip}`}>{tip.tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-surface lg:sticky lg:top-8">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="feedback-channel">Preferred contact channel</label>
              <Input
                id="feedback-channel"
                name="feedback-channel"
                autoComplete="off"
                tabIndex={-1}
                value={feedbackChannel}
                onChange={(event) => setFeedbackChannel(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text">Leave feedback</h3>
              <p className="text-sm text-text-muted">Tell us how this recommendation felt after your matches.</p>
            </div>
            <Textarea
              placeholder="Optional notes about how the deck played..."
              value={feedbackNotes}
              onChange={(event) => setFeedbackNotes(event.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => submitFeedback(1)}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? <Loader2 className="size-4 animate-spin" /> : <ThumbsUp className="size-4" />}
                Loved it
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => submitFeedback(-1)}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? <Loader2 className="size-4 animate-spin" /> : <ThumbsDown className="size-4" />}
                Needs work
              </Button>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-muted/40 p-4 text-sm text-text-muted">
              <MessageCircle className="size-4 shrink-0 text-accent" />
              <p>
                Thanks for sharing your experience. We review feedback weekly to keep the recommendations sharp and responsive to
                balance changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function RecommendationResultsSkeleton({ showHistoryNavigation = true }: { showHistoryNavigation?: boolean } = {}) {
  return (
    <div className="space-y-10">
      {showHistoryNavigation && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-36" />
        </div>
      )}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        {showHistoryNavigation && <Skeleton className="h-10 w-32" />}
      </header>
      <div className="grid gap-8 items-start lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-32" />
              ))}
            </div>
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-6 rounded-xl border border-border/80 bg-surface-muted/40 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-56" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                  <Skeleton className="h-12 w-36" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-40" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-36 w-full" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </section>
              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-surface-muted/30 p-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-16 w-full" />
              </section>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-surface lg:sticky lg:top-8">
          <CardContent className="flex flex-col gap-6 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function RecommendationResultsEmptyState({ sessionId }: { sessionId?: string }) {
  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-surface p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <Sparkles className="mx-auto size-8 text-accent" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-text">No recommendations saved</h2>
            <p className="text-sm text-text-muted">
              {sessionId
                ? `We couldn\'t find deck results for session ${sessionId}.`
                : "We couldn\'t find any deck results."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">Start a new recommendation</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/history">View history</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
