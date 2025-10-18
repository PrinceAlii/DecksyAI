import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PlayerOnboarding } from "@/components/features/player-onboarding";
import { Container } from "@/components/ui/container";
import { SiteHeader } from "@/components/ui/site-header";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SearchPageProps {
  searchParams: {
    tag?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await getServerAuthSession();
  const playerTag = searchParams.tag;

  // If user is logged in and has a player tag, but no search tag provided, use their tag
  if (session?.user?.id && prisma && !playerTag) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { playerTag: true },
    });
    
    if (profile?.playerTag) {
      // Redirect with their player tag
      redirect(`/search?tag=${encodeURIComponent(profile.playerTag)}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader showPlayerSearch />
      <main className="relative flex-1 overflow-hidden py-16">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-[-10%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-1/4 top-[20%] h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[120px]" />
          <div className="absolute left-1/3 bottom-[10%] h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-[100px]" />
        </div>
        
        <Container className="relative">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 text-3xl font-semibold text-text">
              {playerTag ? "Get Deck Recommendations" : "Search Player"}
            </h1>
            <PlayerOnboarding initialPlayerTag={playerTag} />
          </div>
        </Container>
      </main>
    </div>
  );
}
