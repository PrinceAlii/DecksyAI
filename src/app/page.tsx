import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { PlayerOnboarding } from "@/components/features/player-onboarding";
import { HeroBackground } from "@/components/marketing/hero-background";
import { HeroContent } from "@/components/marketing/hero-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SiteHeader } from "@/components/ui/site-header";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await getServerAuthSession();

  // If user is logged in and has a player tag, redirect to search page with their tag
  if (session?.user?.id && prisma) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { playerTag: true },
    });
    
    if (profile?.playerTag) {
      redirect(`/search?tag=${encodeURIComponent(profile.playerTag)}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 py-20">
          <HeroBackground />
          <Container className="relative">
            <HeroContent>
              <GradientText as="p" className="mb-6 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Clash Royale Deck Intelligence
              </GradientText>
              <h1 className="mx-auto max-w-[min(48rem,90vw)] text-balance text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[clamp(3rem,5.6vw,4.1rem)]">
                Build decks that match <span className="text-primary">your cards</span> and
                <span className="text-accent"> your playstyle</span>
              </h1>
              <p className="mt-6 mx-auto max-w-[min(40rem,88vw)] text-base text-text-muted sm:text-lg">
                Decksy AI analyzes your profile, favorite archetypes, and battle history to recommend
                decks you&apos;ll actually love to play—then coaches you to climb faster with Gemini-powered
                explainers.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="gap-2" variant="glow">
                  <Link href="#get-started">
                    Enter your player tag
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="glass" asChild className="gap-2">
                  <Link href="/deck/sample">See sample deck guide</Link>
                </Button>
              </div>
            </HeroContent>
          </Container>
        </section>

        <section id="get-started" className="py-20">
          <Container className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <PlayerOnboarding />

            <div className="grid gap-6">
              <Card className="p-6">
                <CardContent className="p-0">
                  <CardHeader icon={<Trophy className="size-5" />} className="gap-4">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-text">Tailored for your climb</h3>
                      <p className="text-sm text-text-muted">
                        Decksy scores decks against your arena, trophies, and card levels using a transparent
                        rules engine. Every recommendation is ranked based on how well it matches your
                        current progression.
                      </p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-primary">•</span>
                          <span>Analyzes your card collection and levels</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-primary">•</span>
                          <span>Considers your current trophy range</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-primary">•</span>
                          <span>Matches decks to your arena meta</span>
                        </li>
                      </ul>
                    </div>
                  </CardHeader>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="p-0">
                  <CardHeader icon={<Sparkles className="size-5" />} className="gap-4">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-text">AI explainers that teach</h3>
                      <p className="text-sm text-text-muted">
                        Powered by Google Gemini, our AI analyzes each recommended deck to provide
                        personalized coaching insights you can actually use to improve your gameplay.
                      </p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-accent">•</span>
                          <span>Win conditions and key card combos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-accent">•</span>
                          <span>Matchup strengths and weaknesses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-accent">•</span>
                          <span>Safe card substitutions if needed</span>
                        </li>
                      </ul>
                    </div>
                  </CardHeader>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-surface py-8">
        <Container className="flex flex-col gap-4 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Decksy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href={"/privacy" as Route} className="transition hover:text-text">
              Privacy
            </Link>
            <Link href={"/terms" as Route} className="transition hover:text-text">
              Terms
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
