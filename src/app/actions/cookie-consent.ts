"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit-log";
import { getServerAuthSession } from "@/lib/auth";
import { COOKIE_CONSENT_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const consentSchema = z.object({
  analytics: z.boolean(),
});

export type CookieConsentState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: CookieConsentState = { status: "idle" };

export async function updateCookieConsentAction(payload: { analytics: boolean }): Promise<CookieConsentState> {
  const parsed = consentSchema.safeParse(payload);

  if (!parsed.success) {
    return { status: "error", message: "Invalid consent payload." };
  }

  const cookieStore = cookies();
  const issuedAt = new Date();

  try {
    cookieStore.set({
      name: COOKIE_CONSENT_COOKIE,
      value: JSON.stringify({
        analytics: parsed.data.analytics,
        updatedAt: issuedAt.toISOString(),
      }),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });

    const session = await getServerAuthSession();

    if (session?.user?.id && prisma) {
      await prisma.cookieConsent.upsert({
        where: { userId: session.user.id },
        update: {
          analytics: parsed.data.analytics,
        },
        create: {
          userId: session.user.id,
          analytics: parsed.data.analytics,
        },
      });
    }

    await recordAuditLog("privacy.cookie_consent.updated", {
      actorId: session?.user?.id,
      metadata: {
        analytics: parsed.data.analytics,
      },
    });

    return { status: "success" };
  } catch (error) {
    console.error("Failed to persist cookie consent", error);
    return {
      status: "error",
      message: "We couldn't record your cookie preference. Please try again.",
    };
  }
}

export { initialState as cookieConsentInitialState };
