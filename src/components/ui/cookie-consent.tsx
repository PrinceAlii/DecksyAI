import { cookies } from "next/headers";

import { COOKIE_CONSENT_COOKIE } from "@/app/actions/cookie-consent";
import { CookieConsentBannerClient } from "@/components/ui/cookie-consent-client";
import { getServerAuthSession } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type ParsedConsent = {
  analytics: boolean;
  updatedAt: string;
};

function parseConsent(value?: string | null): ParsedConsent | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ParsedConsent;
    if (typeof parsed.analytics === "boolean" && typeof parsed.updatedAt === "string") {
      return parsed;
    }
  } catch (error) {
    console.warn("Invalid cookie consent payload", error);
  }
  return null;
}

export async function CookieConsentBanner() {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  const cookieStore = cookies();
  const cookieValue = cookieStore.get(COOKIE_CONSENT_COOKIE)?.value;
  const parsedCookie = parseConsent(cookieValue);

  if (parsedCookie) {
    return null;
  }

  if (cookieValue && !parsedCookie) {
    cookieStore.delete(COOKIE_CONSENT_COOKIE);
  }

  const session = await getServerAuthSession();

  if (session?.user?.id && prisma) {
    const consentRecord = await prisma.cookieConsent.findUnique({ where: { userId: session.user.id } });
    if (consentRecord) {
      return null;
    }
  }

  return <CookieConsentBannerClient />;
}

export default CookieConsentBanner;
