-- Add viewCount and copyCount for public deck tracking
-- Add indexes for public deck browsing

ALTER TABLE "CustomDeck" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CustomDeck" ADD COLUMN "copyCount" INTEGER NOT NULL DEFAULT 0;

-- Add indexes for efficient querying
CREATE INDEX "CustomDeck_isPublic_createdAt_idx" ON "CustomDeck"("isPublic", "createdAt");
CREATE INDEX "CustomDeck_isPublic_viewCount_idx" ON "CustomDeck"("isPublic", "viewCount");
