"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { updateCookieConsentAction } from "@/app/actions/cookie-consent";
import { Button } from "@/components/ui/button";

interface CookieConsentBannerClientProps {
  privacyHref?: string;
}

export function CookieConsentBannerClient({ privacyHref = "/privacy" }: CookieConsentBannerClientProps) {
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleChoice = (analytics: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCookieConsentAction({ analytics });
      if (result.status === "success") {
        setDismissed(true);
      } else if (result.status === "error") {
        setError(result.message ?? "Something went wrong while saving your preference.");
      }
    });
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl border border-border/60 bg-surface/95 p-4 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="space-y-2 text-sm">
        <h2 className="font-semibold text-text">We use cookies to improve Decksy</h2>
        <p className="text-xs text-text-muted">
          Decksy uses essential cookies to keep the app running and optional analytics to learn what works. Choose whether to
          share anonymous usage data. You can change your mind later from the privacy page.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => handleChoice(true)}>
          Allow analytics
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => handleChoice(false)}>
          Essential only
        </Button>
        <Button asChild size="sm" variant="ghost" disabled={pending} className="ml-auto text-xs">
          <Link href={privacyHref}>Privacy controls</Link>
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
