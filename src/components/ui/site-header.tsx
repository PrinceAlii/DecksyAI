import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";

import { SignOutButton } from "@/components/features/auth/sign-out-button";
import { PlayerSearch } from "@/components/features/player-search";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SiteHeaderProps {
  showPlayerSearch?: boolean;
}

export async function SiteHeader({ showPlayerSearch = false }: SiteHeaderProps) {
  const session = await getServerAuthSession();
  
  // Check if user has a player tag in their profile
  let hasPlayerTag = false;
  if (session?.user?.id && prisma) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { playerTag: true },
    });
    hasPlayerTag = !!profile?.playerTag;
  }

  return (
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
        <nav className="flex items-center gap-3 text-sm text-text-muted">
          {/* Show player search if user is logged in and has a player tag, or if explicitly requested */}
          {session?.user && (hasPlayerTag || showPlayerSearch) && <PlayerSearch />}
          
          <Link href={"/account" as Route} className="transition hover:text-text">
            Account
          </Link>
          {session?.user ? (
            <>
              <span className="hidden text-xs text-text-muted sm:inline">
                {session.user.email ?? "Signed in"}
              </span>
              <SignOutButton
                variant="outline"
                size="sm"
                label="Sign out"
                redirectTo="/"
                className="text-xs"
              />
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={"/login" as Route}>Log in</Link>
            </Button>
          )}
        </nav>
      </Container>
    </header>
  );
}
