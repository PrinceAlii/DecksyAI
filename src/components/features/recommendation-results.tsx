"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DeckDefinition } from "@/lib/data/deck-catalog";

interface Explainer {
  summary: string;
  substitutions: { card: string; suggestion: string }[];
  matchupTips: { archetype: string; tip: string }[];
}

export interface RecommendationDeckResult {
  deck: DeckDefinition;
  score: number;
  breakdown: {
    collection: number;
    trophies: number;
    playstyle: number;
    difficulty: number;
  };
  notes: string[];
  explainer?: Explainer;
}

interface RecommendationResultsProps {
  sessionId: string;
  playerTag: string;
  trophyInfo: string;
  results: RecommendationDeckResult[];
}

export function RecommendationResults({ sessionId, playerTag, trophyInfo, results }: RecommendationResultsProps) {
  const [selectedDeck, setSelectedDeck] = useState(results[0]?.deck.slug ?? "");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
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
        }),
      });
      setFeedbackNotes("");
    } catch (error) {
      console.warn("Unable to send feedback", error);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-text">Your deck recommendations</h1>
          <p className="text-sm text-text-muted">Tag #{playerTag} • {trophyInfo}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => router.push("/history")}>View history</Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/60 bg-surface">
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
                <section className="flex flex-col gap-6 rounded-xl border border-border/60 bg-surface-muted/40 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-text">{activeDeck.deck.name}</h2>
                      <p className="text-sm text-text-muted">{activeDeck.deck.description}</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-4 py-3 text-right">
                      <span className="text-sm text-text-muted">Average elixir</span>
                      <span className="text-2xl font-semibold text-accent">{activeDeck.deck.averageElixir.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(activeDeck.breakdown).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-4 py-3"
                      >
                        <span className="text-sm capitalize text-text-muted">{key}</span>
                        <span className="text-lg font-semibold text-text">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-medium uppercase tracking-wide text-text-muted">Deck cards</h3>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {activeDeck.deck.cards.map((card) => {
                        const imageSrc = card.image ?? `https://royaleapi.github.io/static/img/cards-150/${card.key}.png`;
                        return (
                          <div
                            key={card.key}
                            className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-background/80 p-3 text-center"
                          >
                            <div
                              className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-surface bg-cover bg-center"
                              style={{ backgroundImage: "url(/cards/placeholder.svg)" }}
                            >
                              <Image
                                src={imageSrc}
                                alt={card.name}
                                fill
                                sizes="(max-width: 640px) 33vw, 160px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-text">{card.name}</p>
                              <p className="text-xs text-text-muted">Lvl {card.levelRequirement}</p>
                            </div>
                          </div>
                        );
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

        <Card className="border-border/60 bg-surface">
          <CardContent className="flex flex-col gap-6 p-6">
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
