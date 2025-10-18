import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DeckBuilderClient } from "@/components/features/deck-builder/deck-builder-client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SiteHeader } from "@/components/ui/site-header";
import { GradientText } from "@/components/ui/gradient-text";

export const metadata = {
  title: "Deck Builder | Decksy AI",
  description: "Build custom Clash Royale decks with our interactive deck builder",
};

export default function DeckBuilderPage() {
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

        <Container className="relative space-y-8">
          <Button asChild variant="ghost" className="gap-2 text-text-muted hover:text-text">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
          </Button>

          <div className="max-w-3xl space-y-4">
            <GradientText as="p" className="text-xs font-semibold uppercase tracking-[0.4em]">
              Custom Deck Builder
            </GradientText>
            <h1 className="text-balance text-4xl font-semibold text-text sm:text-5xl">
              Build Your Perfect Deck
            </h1>
            <p className="text-base text-text-muted sm:text-lg">
              Select 8 cards to create a custom deck. Click cards to add or remove them. Once complete,
              save your deck and get AI-powered coaching insights.
            </p>
          </div>

          <Suspense fallback={<div className="text-text-muted">Loading deck builder...</div>}>
            <DeckBuilderClient />
          </Suspense>
        </Container>
      </div>
    </div>
  );
}
