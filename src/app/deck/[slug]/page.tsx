import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";

import { DeckExplainerPanel } from "@/components/features/deck-explainer/deck-explainer-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { getDeckBySlug } from "@/lib/data/deck-catalog";
import type { GeminiExplainer } from "@/lib/gemini";

interface ExplainerRecord {
  deck: {
    name: string;
    description: string;
    averageElixir: number;
    cards: { name: string; key: string; levelRequirement: number; image?: string }[];
    strengths: string[];
    weaknesses: string[];
  };
  explainers?: GeminiExplainer[];
}

async function fetchExplainer(slug: string, origin: string, sessionId?: string) {
  const url = new URL(`/api/coach`, origin);
  url.searchParams.set("deck", slug);
  if (sessionId) {
    url.searchParams.set("sessionId", sessionId);
  }

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ExplainerRecord;
}

export default async function DeckPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sessionId?: string };
}) {
  const deck = getDeckBySlug(params.slug);

  if (!deck) {
    notFound();
  }

  const requestHeaders = headers();
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() && process.env.NEXT_PUBLIC_BASE_URL.trim().length > 0
      ? process.env.NEXT_PUBLIC_BASE_URL.trim()
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://${requestHeaders.get("host") ?? "localhost:3000"}`;

  const data = await fetchExplainer(deck.slug, origin, searchParams.sessionId);
  const explainer = data?.explainers?.[0];
  const practicePlanEnabled = process.env.NEXT_PUBLIC_FEATURE_PRACTICE_PLAN === "true";

  return (
    <div className="bg-background py-16">
      <Container className="space-y-10">
        <Button asChild variant="ghost" className="gap-2 text-text-muted hover:text-text">
          <Link href={searchParams.sessionId ? `/recommend?sessionId=${encodeURIComponent(searchParams.sessionId)}` : "/recommend"}>
            <ArrowLeft className="size-4" />
            Back to recommendations
          </Link>
        </Button>

        <Card className="border-border/60 bg-surface">
          <CardContent className="flex flex-col gap-8 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-text">{deck.name}</h1>
                <p className="text-sm text-text-muted">{deck.description}</p>
              </div>
              <Badge variant="secondary" className="text-base">
                {deck.averageElixir.toFixed(1)} elixir
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">Card lineup</h2>
              <div className="grid gap-3 sm:grid-cols-4">
                {deck.cards.map((card) => {
                  // Try a few more resilient external filenames. Many CDNs use
                  // hyphenated names (mega-knight) rather than underscores
                  // (mega_knight). Prefer a local `public/cards` override if
                  // present, otherwise attempt the hyphenated remote image.
                  const localSrc = `/cards/${card.key}.png`;
                  const remoteUnderscore = `https://royaleapi.github.io/static/img/cards-150/${card.key}.png`;
                  const remoteHyphen = `https://royaleapi.github.io/static/img/cards-150/${card.key.replace(/_/g, "-")}.png`;
                  const imageSrc = card.image ?? localSrc ?? remoteHyphen ?? remoteUnderscore;
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

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-text">Strengths</h2>
                <ul className="mt-2 space-y-2 text-sm text-text-muted">
                  {deck.strengths.map((strength) => (
                    <li key={strength} className="flex items-start gap-2">
                      <ListChecks className="mt-0.5 size-4 text-accent" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">Watch outs</h2>
                <ul className="mt-2 space-y-2 text-sm text-text-muted">
                  {deck.weaknesses.map((weakness) => (
                    <li key={weakness} className="flex items-start gap-2">
                      <ListChecks className="mt-0.5 size-4 text-warning" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {(explainer || searchParams.sessionId) && (
          <DeckExplainerPanel
            deckSlug={deck.slug}
            sessionId={searchParams.sessionId}
            initialExplainer={explainer ?? null}
            practicePlanEnabled={practicePlanEnabled}
          />
        )}
      </Container>
    </div>
  );
}
