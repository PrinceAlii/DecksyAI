import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/features/auth/login-form";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerAuthSession } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";

function resolveErrorMessage(code?: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    OAuthSignin: "We couldn't reach the provider. Try again in a moment.",
    OAuthCallback: "GitHub rejected the sign-in attempt. Please retry.",
    EmailSignin: "We couldn't send the magic link. Double-check your email and try again.",
    CredentialsSignin: "Invalid sign-in request. Please try again.",
    AccessDenied: "Access denied. Contact support if this continues.",
    Verification: "The verification link is invalid or has expired.",
  };
  return map[code] ?? "Something went wrong while signing in. Please try again.";
}

function resolveStatusMessage(status?: string | null): string | null {
  if (status === "check-email") {
    return "Check your inbox for the Decksy magic link.";
  }
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerAuthSession();

  const callbackParam = typeof searchParams?.callbackUrl === "string" ? searchParams?.callbackUrl : undefined;
  const callbackUrl = callbackParam && callbackParam.length > 0 ? callbackParam : "/account";

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  const env = getServerEnv();
  const githubEnabled = Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET);
  const emailDeliveryConfigured = Boolean(env.RESEND_API_KEY);

  const errorMessage = resolveErrorMessage(
    typeof searchParams?.error === "string" ? searchParams?.error : undefined,
  );
  const statusMessage = resolveStatusMessage(
    typeof searchParams?.status === "string" ? searchParams?.status : undefined,
  );

  return (
    <div className="min-h-screen bg-background py-8 sm:py-16">
      <Container className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 text-text-muted">
              <Link href="/">
                <ArrowLeft className="mr-2 size-4" /> Home
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-semibold text-text">Log in to Decksy</h1>
            <p className="text-sm text-text-muted">
              Use a secure magic link or sign in with GitHub to sync your deck history, feedback, and coaching notes across every
              device.
            </p>
          </div>

          <LoginForm
            callbackUrl={callbackUrl}
            githubEnabled={githubEnabled}
            emailDeliveryConfigured={emailDeliveryConfigured}
            errorMessage={errorMessage}
            statusMessage={statusMessage}
          />

          <p className="text-xs text-text-muted">
            By signing in you agree to our {" "}
            <Link href="/terms" className="text-text underline underline-offset-2">
              terms of use
            </Link>{" "}
            and {" "}
            <Link href="/privacy" className="text-text underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>

        <Card className="border-border/60 bg-surface/80">
          <CardContent className="space-y-4 p-6 text-sm text-text-muted">
            <h2 className="text-lg font-semibold text-text">Production-ready security</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Magic links expire after 10 minutes and can be revoked anytime.</li>
              <li>Sessions are stored server-side and audited for suspicious activity.</li>
              <li>
                We only request your email - no Supercell credentials are ever collected or stored by Decksy.
              </li>
            </ul>
            <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-text">
              <ShieldCheck className="size-5 text-primary" />
              <p className="text-sm">
                Tip: add <span className="font-semibold">login@decksy.dev</span> to your contacts so the magic link never ends up
                in spam.
              </p>
            </div>
            <p>
              Need help? Email {" "}
              <Link href="mailto:support@decksy.dev" className="text-text underline underline-offset-2">
                support@decksy.dev
              </Link>{" "}
              and we&apos;ll get you signed in.
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
