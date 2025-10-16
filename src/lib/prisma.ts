import { PrismaClient } from "@prisma/client";

import { getServerEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient | undefined {
  const env = getServerEnv();

  if (!env.DATABASE_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("DATABASE_URL is not set. Prisma client will not be initialised.");
    }
    return undefined;
  }

  return new PrismaClient();
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
