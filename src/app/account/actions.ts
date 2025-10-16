"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit-log";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: UpdateProfileState = { status: "idle" };

const profileSchema = z.object({
  playerTag: z.string().max(16).optional(),
  trophies: z.string().max(6).optional(),
  arena: z.string().max(80).optional(),
  playstyle: z.string().max(80).optional(),
  favoriteArchetype: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
});

function normaliseOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function getInputValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in to update your profile." };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Database connection unavailable. Configure DATABASE_URL to enable profile updates.",
    };
  }

  const parseResult = profileSchema.safeParse({
    playerTag: getInputValue(formData, "playerTag"),
    trophies: getInputValue(formData, "trophies"),
    arena: getInputValue(formData, "arena"),
    playstyle: getInputValue(formData, "playstyle"),
    favoriteArchetype: getInputValue(formData, "favoriteArchetype"),
    bio: getInputValue(formData, "bio"),
  });

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message ?? "Invalid profile details.";
    return { status: "error", message: firstError };
  }

  const { playerTag, trophies, arena, playstyle, favoriteArchetype, bio } = parseResult.data;

  const cleanedTag = (() => {
    const trimmed = playerTag?.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length < 5 || cleaned.length > 14) {
      return null;
    }
    return cleaned;
  })();

  let parsedTrophies: number | null = null;
  const trophiesInput = trophies?.trim();
  if (trophiesInput && trophiesInput.length > 0) {
    const numeric = Number(trophiesInput);
    if (!Number.isFinite(numeric)) {
      return { status: "error", message: "Trophies must be a number." };
    }
    if (numeric < 0 || numeric > 10000) {
      return { status: "error", message: "Trophies must be between 0 and 10000." };
    }
    parsedTrophies = Math.round(numeric);
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        playerTag: cleanedTag,
        trophies: parsedTrophies,
        arena: normaliseOptional(arena),
        playstyle: normaliseOptional(playstyle),
        favoriteArchetype: normaliseOptional(favoriteArchetype),
        bio: normaliseOptional(bio),
      },
      create: {
        userId: session.user.id,
        playerTag: cleanedTag,
        trophies: parsedTrophies,
        arena: normaliseOptional(arena),
        playstyle: normaliseOptional(playstyle),
        favoriteArchetype: normaliseOptional(favoriteArchetype),
        bio: normaliseOptional(bio),
      },
    });

    await recordAuditLog("profile.updated", {
      actorId: session.user.id,
      metadata: {
        playerTag: profile.playerTag,
        trophies: profile.trophies,
        arena: profile.arena,
        playstyle: profile.playstyle,
      },
    });

    revalidatePath("/account");
    return { status: "success", message: "Profile updated." };
  } catch (error) {
    console.error("Failed to update profile", error);
    return {
      status: "error",
      message: "Something went wrong while saving your profile. Please try again.",
    };
  }
}

export { initialState as updateProfileInitialState };

export async function revokeSessionsAction(
  _prevState: UpdateProfileState,
): Promise<UpdateProfileState> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in to manage sessions." };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Database connection unavailable. Configure DATABASE_URL to manage sessions.",
    };
  }

  try {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    await recordAuditLog("auth.sessions_revoked", { actorId: session.user.id });
    revalidatePath("/account");
    return { status: "success", message: "All sessions revoked. Sign in again to continue." };
  } catch (error) {
    console.error("Failed to revoke sessions", error);
    return {
      status: "error",
      message: "We couldn't revoke sessions. Please try again shortly.",
    };
  }
}

export { initialState as revokeSessionsInitialState };
