-- AlterTable DeckCatalog - Add missing fields
ALTER TABLE "DeckCatalog" ADD COLUMN "trophyBand" TEXT NOT NULL DEFAULT '',
ADD COLUMN "trophyRange" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "playstyles" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "archetypeNotes" TEXT NOT NULL DEFAULT '';
