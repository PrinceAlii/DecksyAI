import { Prisma, PrismaClient } from "@prisma/client";

import { deckCatalog } from "../src/lib/data/deck-catalog";

export async function seedDeckCatalog(prisma: PrismaClient) {
  for (const deck of deckCatalog) {
    await prisma.deckCatalog.upsert({
      where: { slug: deck.slug },
      update: {
        name: deck.name,
        archetype: deck.archetype,
        trophyBand: deck.trophyBand,
        trophyRange: deck.trophyRange as unknown as Prisma.JsonValue,
        playstyles: deck.playstyles as unknown as Prisma.JsonValue,
        archetypeNotes: deck.archetypeNotes,
        description: deck.description,
        averageElixir: deck.averageElixir,
        cards: deck.cards as unknown as Prisma.JsonValue,
        strengths: deck.strengths as unknown as Prisma.JsonValue,
        weaknesses: deck.weaknesses as unknown as Prisma.JsonValue,
      },
      create: {
        slug: deck.slug,
        name: deck.name,
        archetype: deck.archetype,
        trophyBand: deck.trophyBand,
        trophyRange: deck.trophyRange as unknown as Prisma.JsonValue,
        playstyles: deck.playstyles as unknown as Prisma.JsonValue,
        archetypeNotes: deck.archetypeNotes,
        description: deck.description,
        averageElixir: deck.averageElixir,
        cards: deck.cards as unknown as Prisma.JsonValue,
        strengths: deck.strengths as unknown as Prisma.JsonValue,
        weaknesses: deck.weaknesses as unknown as Prisma.JsonValue,
      },
    });
  }
}

async function run() {
  const prisma = new PrismaClient();
  try {
    await seedDeckCatalog(prisma);
    console.log(`Seeded ${deckCatalog.length} deck catalog entries.`);
  } catch (error) {
    console.error("Failed to seed deck catalog", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("seed-deck-catalog")) {
  run();
}
