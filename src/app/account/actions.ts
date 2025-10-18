"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit-log";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAccountExport } from "@/lib/storage/account-export";
import { COOKIE_CONSENT_COOKIE } from "@/lib/constants";
import type {
  UpdateProfileState,
  ExportAccountState,
  DeleteAccountState,
} from "./types";

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

function serialiseRecord<T extends Record<string, unknown>>(record: T) {
  const next: Record<string, unknown> = { ...record };

  if (record && typeof record === "object") {
    if (record instanceof Date) {
      return record.toISOString() as unknown as T;
    }

    const maybeCreatedAt = (record as Record<string, unknown>).createdAt;
    if (maybeCreatedAt instanceof Date) {
      next.createdAt = maybeCreatedAt.toISOString();
    }

    const maybeUpdatedAt = (record as Record<string, unknown>).updatedAt;
    if (maybeUpdatedAt instanceof Date) {
      next.updatedAt = maybeUpdatedAt.toISOString();
    }

    const maybeDeletedAt = (record as Record<string, unknown>).deletedAt;
    if (maybeDeletedAt instanceof Date) {
      next.deletedAt = maybeDeletedAt.toISOString();
    }
  }

  return next as T;
}

export async function exportAccountDataAction(
  _prevState: ExportAccountState,
): Promise<ExportAccountState> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in to export your account." };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Database connection unavailable. Configure DATABASE_URL before exporting data.",
    };
  }

  try {
    const [userRecord, recommendationRecords, feedbackRecords] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          profile: true,
          feedbackPreference: true,
          accounts: true,
          cookieConsent: true,
        },
      }),
      prisma.recommendation.findMany({
        where: { userId: session.user.id },
        include: { feedback: true, explainers: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.feedback.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!userRecord) {
      return { status: "error", message: "Unable to locate your account." };
    }

    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: serialiseRecord(userRecord),
      profile: userRecord.profile ? serialiseRecord(userRecord.profile) : null,
      feedbackPreference: userRecord.feedbackPreference
        ? serialiseRecord(userRecord.feedbackPreference)
        : null,
      accounts: userRecord.accounts.map((account) => ({
        ...account,
      })),
      cookieConsent: userRecord.cookieConsent
        ? serialiseRecord({ ...userRecord.cookieConsent })
        : null,
      recommendations: recommendationRecords.map((recommendation) => ({
        ...serialiseRecord(recommendation),
        feedback: recommendation.feedback.map(serialiseRecord),
        explainers: recommendation.explainers.map((explainer) => ({
          ...serialiseRecord(explainer),
          recommendationId: explainer.recommendationId,
        })),
      })),
      feedback: feedbackRecords.map(serialiseRecord),
    };

    const file = await writeAccountExport(session.user.id, exportPayload);

    await prisma.accountDataExport.create({
      data: {
        userId: session.user.id,
        storagePath: file.storagePath,
        storageProvider: "filesystem",
        fileSize: file.bytes,
        checksum: file.checksum,
        metadata: {
          recommendationCount: recommendationRecords.length,
          feedbackCount: feedbackRecords.length,
        },
      },
    });

    await recordAuditLog("account.exported", {
      actorId: session.user.id,
      metadata: {
        storagePath: file.storagePath,
        fileSize: file.bytes,
      },
    });

    return {
      status: "success",
      message: "Your account export is ready. Use the admin tools to retrieve the bundle.",
      downloadPath: file.storagePath,
      checksum: file.checksum,
    };
  } catch (error) {
    console.error("Failed to export account", error);
    return {
      status: "error",
      message: "We couldn't build your export bundle. Please try again shortly.",
    };
  }
}

export async function deleteAccountAction(
  _prevState: DeleteAccountState,
): Promise<DeleteAccountState> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return { status: "error", message: "You need to be signed in to delete your account." };
  }

  if (!prisma) {
    return {
      status: "error",
      message: "Database connection unavailable. Configure DATABASE_URL before deleting accounts.",
    };
  }

  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const recommendations = await tx.recommendation.findMany({
        where: { userId },
        select: { id: true },
      });
      const recommendationIds = recommendations.map((item) => item.id);

      if (recommendationIds.length > 0) {
        await tx.feedback.deleteMany({ where: { recommendationId: { in: recommendationIds } } });
        await tx.explainer.updateMany({
          where: { recommendationId: { in: recommendationIds } },
          data: { recommendationId: null },
        });
        await tx.recommendation.deleteMany({ where: { id: { in: recommendationIds } } });
      }

      await tx.feedback.deleteMany({ where: { userId } });
      await tx.feedbackPreference.deleteMany({ where: { userId } });
      await tx.profile.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.accountDataExport.deleteMany({ where: { userId } });
      await tx.cookieConsent.deleteMany({ where: { userId } });

      await tx.accountDeletion.create({
        data: {
          userId,
          metadata: {
            recommendationIds,
          },
        },
      });

      await tx.user.delete({ where: { id: userId } });
    });

    cookies().delete(COOKIE_CONSENT_COOKIE);

    await recordAuditLog("account.deleted", {
      actorId: userId,
    });

    revalidatePath("/");
    revalidatePath("/account");

    return {
      status: "success",
      message: "Your account and related recommendations have been removed. You will be signed out shortly.",
    };
  } catch (error) {
    console.error("Failed to delete account", error);
    return {
      status: "error",
      message: "We couldn't delete your account right now. Please try again soon.",
    };
  }
}

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

  const userId = session.user.id;
  const userEmail = session.user.email;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId } });

      const email =
        userEmail ?? (await tx.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? null;

      if (email) {
        await tx.verificationToken.deleteMany({ where: { identifier: email } });
      }
    });
    await recordAuditLog("auth.sessions_revoked", { actorId: userId });
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
