import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ListChecks, Sparkles, Target, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SiteHeader } from "@/components/ui/site-header";
import { getCardArtUrl } from "@/lib/data/card-art";
import { getDeckBySlug } from "@/lib/data/deck-catalog";

const SAMPLE_DECK_SLUG = "mega-knight-miner-control";

export const metadata: Metadata = {
  title: "Sample deck guide | Decksy AI",
  description:
    "Preview the type of Clash Royale deck analysis Decksy AI delivers, including card breakdowns, matchup strengths, and AI-powered coaching notes.",
};

export default function SampleDeckGuidePage() {
  const deck = getDeckBySlug(SAMPLE_DECK_SLUG);

  if (!deck) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex-1 pb-24">
      <section className="border-b border-border/60 bg-surface/60 py-16">
        <Container className="space-y-10">
          <Button asChild variant="ghost" className="gap-2 text-text-muted hover:text-text">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
          </Button>

          <div className="max-w-3xl space-y-5">
            <GradientText as="p" className="text-xs font-semibold uppercase tracking-[0.4em]">
              Sample deck guide
            </GradientText>
            <h1 className="text-balance text-4xl font-semibold text-text sm:text-5xl">{deck.name}</h1>
            <p className="text-base text-text-muted sm:text-lg">
              Here&apos;s the type of breakdown Decksy creates when a recommendation matches your trophies, card levels, and playstyle.
              Explore the full guide, then start your own run to get a personalized version in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
              <Badge variant="secondary" className="text-sm">
                {deck.averageElixir.toFixed(1)} average elixir
              </Badge>
              <Badge variant="outline" className="text-sm">
                {deck.archetype.charAt(0).toUpperCase() + deck.archetype.slice(1)} archetype
              </Badge>
              <span>{deck.trophyBand}</span>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="space-y-12">
          <Card className="border-border/70 bg-surface/80">
            <CardContent className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-text">Deck breakdown</h2>
                  <p className="text-sm text-text-muted">
                    A proven ladder list from our constantly updated catalog. We show every card, level expectation, and how the deck is meant to flow.
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  Trophy range {deck.trophyRange[0]}-{deck.trophyRange[1]}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {deck.cards.map((card) => (
                  <div
                    key={card.key}
                    className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-4 text-center"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface">
                      <Image
                        src={getCardArtUrl(card)}
                        alt={card.name}
                        fill
                        sizes="(max-width: 768px) 45vw, 180px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-text">{card.name}</p>
                      <p className="text-xs text-text-muted">Lvl {card.levelRequirement}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/60 bg-background/90 p-0">
                  <CardContent className="p-6">
                    <CardHeader icon={<Trophy className="size-6" />}>
                      <div>
                        <h3 className="text-lg font-semibold text-text">Why Decksy likes it for you</h3>
                        <p className="mt-1 text-sm text-text-muted">
                          Control archetype, bridge-pressure playstyle, and mid-ladder trophy targets line up with the preferences you set in onboarding.
                        </p>
                      </div>
                    </CardHeader>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/90 p-0">
                  <CardContent className="p-6">
                    <CardHeader icon={<Target className="size-6" />} iconClassName="text-accent">
                      <div>
                        <h3 className="text-lg font-semibold text-text">Core win conditions</h3>
                        <ul className="mt-2 space-y-2 text-sm text-text-muted">
                          <li className="flex items-start gap-2">
                            <ListChecks className="mt-0.5 size-4 text-accent" />
                            <span>Mega Knight counterpushes to punish overcommitments.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ListChecks className="mt-0.5 size-4 text-accent" />
                            <span>Miner chip pressure to close games without overextending.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ListChecks className="mt-0.5 size-4 text-accent" />
                            <span>Wall Breakers cycles that force awkward responses at low elixir.</span>
                          </li>
                        </ul>
                      </div>
                    </CardHeader>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/60 bg-surface/80">
              <CardContent className="space-y-4">
                <CardHeader icon={<Sparkles className="size-6" />} iconClassName="text-primary">
                  <div>
                    <h2 className="text-lg font-semibold text-text">Gemini-powered coaching snapshot</h2>
                    <p className="mt-1 text-sm text-text-muted">
                      Every recommendation ships with explainers tailored to your arena. Here&apos;s a sample of what you&apos;d see in your inbox.
                    </p>
                  </div>
                </CardHeader>
                <div className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-5 text-sm text-text-muted">
                  <p className="text-text font-medium">Opening game plan</p>
                  <p>
                    &ldquo;Open with a Miner + Wall Breakers push opposite lane after defending to scout their counters. Track their splash answers so you can time Mega Knight on counterpushes.&rdquo;
                  </p>
                  <p className="text-text font-medium">Practice focus</p>
                  <p>
                    &ldquo;Drill Inferno Dragon resets versus air win conditions. Counting their reset spells keeps your tower safe and powers up your double-lane pressure.&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-surface/80">
              <CardContent className="space-y-4">
                <CardHeader icon={<Target className="size-6" />} iconClassName="text-warning">
                  <div>
                    <h2 className="text-lg font-semibold text-text">Matchup watch list</h2>
                    <p className="mt-1 text-sm text-text-muted">
                      Decksy flags the key opponents to respect so you can prep counters before you queue.
                    </p>
                  </div>
                </CardHeader>
                <ul className="space-y-3 text-sm text-text-muted">
                  <li className="flex items-start gap-3">
                    <ListChecks className="mt-0.5 size-4 text-warning" />
                    <span>Air swarm decks – keep Baby Dragon or Zap ready when committing Mega Knight.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ListChecks className="mt-0.5 size-4 text-warning" />
                    <span>Buildings that stall Miner chip – mix in Giant Snowball to push troops off placement spots.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ListChecks className="mt-0.5 size-4 text-warning" />
                    <span>Spell cycle opponents – hold Zap for defense and win via counterpush crowns.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-3xl border border-border/60 bg-surface/70 p-10 text-center">
            <h2 className="text-2xl font-semibold text-text">Ready for your personalized guide?</h2>
            <p className="mt-3 text-sm text-text-muted sm:text-base">
              Enter your player tag on the home page and Decksy will analyze your card levels, favorite archetypes, and recent history to generate a full report like this just for you.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="glow" asChild>
                <Link href="/#get-started">Start with your player tag</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Log in to save progress</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
      </div>
    </div>
  );
}
