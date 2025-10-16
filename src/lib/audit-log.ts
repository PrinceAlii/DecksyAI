import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface AuditLogContext {
  actorId?: string;
  metadata?: Prisma.JsonValue;
}

export async function recordAuditLog(action: string, context: AuditLogContext = {}): Promise<void> {
  if (!prisma) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[AuditLog] Prisma client unavailable. Action '${action}' not persisted.`);
    }
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId: context.actorId,
        metadata: (context.metadata as Prisma.JsonValue) ?? {},
      },
    });
  } catch (error) {
    console.error(`[AuditLog] Failed to persist action '${action}':`, error);
  }
}
