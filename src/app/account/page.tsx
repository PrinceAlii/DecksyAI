import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LinkIcon, UserCircle, Layers } from "lucide-react";

import { AccountProfileForm } from "@/components/features/account/account-profile-form";
import { SessionSecurityCard } from "@/components/features/account/session-security-card";
import { SignOutButton } from "@/components/features/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const providerLabels: Record<string, string> = {
  github: "GitHub",
  email: "Email",
  google: "Google",
};

export default async function AccountPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account")}`);
  }

  if (!prisma) {
    return (
      <div className="bg-background py-16">
        <Container className="space-y-6">
          <h1 className="text-3xl font-semibold text-text">Account</h1>
          <Card className="border-danger/50 bg-danger/10">
            <CardContent className="space-y-3 text-sm text-danger">
              <p>
                Decksy accounts require a configured PostgreSQL database. Set the <code className="font-mono">DATABASE_URL</code>
                {" "}
                environment variable and deploy Prisma migrations before enabling sign in.
              </p>
              <p>
                Once the database connection is available, restart the app and authentication will be enabled automatically.
              </p>
              <Button asChild variant="outline" className="text-danger">
                <Link href="/">Return home</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  const [profile, linkedAccounts, sessions] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.account.findMany({ where: { userId: session.user.id }, orderBy: { provider: "asc" } }),
    prisma.session.findMany({ where: { userId: session.user.id }, orderBy: { expires: "desc" }, take: 5 }),
  ]);

  const defaults = {
    email: session.user.email ?? "",
    playerTag: profile?.playerTag ?? null,
    trophies: profile?.trophies ?? null,
    arena: profile?.arena ?? null,
    playstyle: profile?.playstyle ?? null,
    favoriteArchetype: profile?.favoriteArchetype ?? null,
    bio: profile?.bio ?? null,
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-16">
      <Container className="space-y-8 sm:space-y-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 text-text-muted">
              <Link href="/">
                <ArrowLeft className="mr-2 size-4" /> Home
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-semibold text-text">Account &amp; preferences</h1>
            <p className="text-sm text-text-muted">
              Manage your Clash Royale profile context, connected sign-ins, and security controls in one place.
            </p>
          </div>
          <SignOutButton variant="outline" label="Sign out" />
        </header>

        <Card className="border-border/60 bg-surface">
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <UserCircle className="size-8 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-text">Profile</h2>
                <p className="text-sm text-text-muted">Keep this in sync so recommendations stay accurate.</p>
              </div>
            </div>
            <AccountProfileForm defaults={defaults} />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-surface">
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <Layers className="size-6 text-accent" />
              <div>
                <h2 className="text-lg font-semibold text-text">My Decks</h2>
                <p className="text-sm text-text-muted">Manage your custom deck builds and AI analysis.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/60 p-6 text-center">
              <p className="mb-4 text-sm text-text-muted">
                View and manage all your saved custom decks in one place.
              </p>
              <Button asChild variant="primary">
                <Link href="/account/decks">View My Decks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-surface">
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <LinkIcon className="size-6 text-accent" />
              <div>
                <h2 className="text-lg font-semibold text-text">Connected sign-ins</h2>
                <p className="text-sm text-text-muted">Decksy supports passwordless email and GitHub OAuth today.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/60">
              <ul className="divide-y divide-border/40 text-sm">
                {linkedAccounts.length === 0 && (
                  <li className="p-4 text-text-muted">No OAuth providers linked yet.</li>
                )}
                {linkedAccounts.map((account) => (
                  <li key={account.id} className="flex items-center justify-between p-4">
                    <span className="text-text">
                      {providerLabels[account.provider] ?? account.provider}
                    </span>
                    <span className="text-xs text-text-muted">Linked account ID {account.providerAccountId}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-text-muted">
              Want to disconnect a provider? Revoke the app on the provider side (e.g. GitHub settings) and Decksy will remove it
              automatically.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-surface">
          <CardContent>
            <SessionSecurityCard
              sessions={sessions.map((session) => ({ id: session.id, expires: session.expires.toISOString() }))}
            />
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
