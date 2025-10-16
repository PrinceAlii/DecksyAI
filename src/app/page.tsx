import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { PlayerOnboarding } from "@/components/features/player-onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-surface/60 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Image
              src="/logo.svg"
              alt="Decksy AI"
              width={32}
              height={32}
              className="size-8"
            />
            Decksy AI
          </Link>
          <nav className="flex items-center gap-4 text-sm text-text-muted">
            <Link href="/account" className="transition hover:text-text">
              Account
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
          </nav>
        </Container>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(91,140,255,0.2),_transparent_55%)]" />
          <Container className="relative flex flex-col items-center text-center">
            <GradientText as="p" className="mb-6 text-sm font-medium uppercase tracking-[0.3em]">
              Clash Royale Deck Intelligence
            </GradientText>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl">
              Build decks that match <span className="text-primary">your cards</span> and
              <span className="text-accent"> your playstyle</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-text-muted">
              Decksy AI analyzes your profile, favorite archetypes, and battle history to recommend
              decks you&apos;ll actually love to play—then coaches you to climb faster with Gemini-powered
              explainers.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="gap-2">
                <Link href="#get-started">
                  Enter your player tag
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/deck/sample">See sample deck guide</Link>
              </Button>
            </div>
          </Container>
        </section>

        <section id="get-started" className="py-20">
          <Container className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <PlayerOnboarding />

            <div className="grid gap-6">
              <Card className="border-border/60 bg-surface p-6">
                <CardContent className="flex items-start gap-4 p-0">
                  <span className="mt-1 inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Trophy className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-text">Tailored for your climb</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Decksy scores decks against your arena, trophies, and card levels using a
                      transparent rules engine.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-surface p-6">
                <CardContent className="flex items-start gap-4 p-0">
                  <span className="mt-1 inline-flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-text">AI explainers that teach</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Gemini summarizes win conditions, matchups, and safe substitutions so you know what
                      to practice first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-surface py-8">
        <Container className="flex flex-col gap-4 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Decksy AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-text">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-text">
              Terms
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
