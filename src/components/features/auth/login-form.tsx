"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Github, LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  callbackUrl?: string;
  githubEnabled: boolean;
  emailDeliveryConfigured: boolean;
  errorMessage?: string | null;
  statusMessage?: string | null;
}

export function LoginForm({
  callbackUrl,
  githubEnabled,
  emailDeliveryConfigured,
  errorMessage,
  statusMessage,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(statusMessage ?? null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !email.includes("@")) {
      setState("error");
      setFeedback("Enter a valid email address to receive the magic link.");
      return;
    }

    setState("loading");
    setFeedback(null);

    const result = await signIn("email", {
      email,
      callbackUrl: callbackUrl ?? "/account",
      redirect: false,
    });

    if (result?.ok) {
      setState("success");
      setFeedback("Check your inbox for the Decksy AI magic link. It expires in 10 minutes.");
      setEmail("");
      return;
    }

    setState("error");
    setFeedback(result?.error ?? "We couldn&apos;t send the magic link. Please try again.");
  }

  async function handleGithubSignIn() {
    setState("loading");
    await signIn("github", { callbackUrl: callbackUrl ?? "/account" });
  }

  return (
    <Card className="border-border/70 bg-surface/90">
      <CardContent className="space-y-6 p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-text">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={state === "loading"}
            />
            <p className="text-xs text-text-muted">
              We&apos;ll email you a secure one-time sign-in link.
            </p>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={state === "loading"}>
            <LogIn className="size-4" />
            {state === "loading" ? "Sending magic link..." : "Continue with email"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border/60" />
          or
          <span className="h-px flex-1 bg-border/60" />
        </div>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleGithubSignIn}
            disabled={!githubEnabled || state === "loading"}
          >
            <Github className="size-4" />
            Continue with GitHub
          </Button>
          <Button type="button" variant="outline" className="gap-2" disabled>
            <Mail className="size-4" />
            Google (coming soon)
          </Button>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              state === "error"
                ? "border-danger/70 bg-danger/10 text-danger"
                : state === "success"
                  ? "border-success/70 bg-success/10 text-success"
                  : "border-border/70 bg-surface-muted text-text-muted"
            }`}
          >
            {feedback}
          </div>
        )}

        {errorMessage && !feedback && (
          <div className="rounded-lg border border-danger/70 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        {!emailDeliveryConfigured && (
          <div className="rounded-lg border border-warning/60 bg-warning/10 px-4 py-3 text-xs text-warning">
            Email delivery isn&apos;t fully configured. In development the magic link URL will be logged to the server console.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
